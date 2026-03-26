import * as vscode from 'vscode';
import { exec, execFile } from 'child_process';
import * as path from 'path';
import { FindingsProvider, FindingItem } from './findingsProvider';

export function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel('Vibe Coding Security');
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('vibe-coding-security');
	const findingsProvider = new FindingsProvider();

	vscode.window.registerTreeDataProvider('vibeCodingSecurity.findingsView', findingsProvider);

	const rulesPath = path.join(context.extensionPath, 'rules', 'owasp-web-v1.yml');

	function checkSemgrepInstalled(): Promise<boolean> {
		return new Promise((resolve) => {
			exec('semgrep --version', (error) => {
				resolve(!error);
			});
		});
	}

	function installSemgrep(): Promise<void> {
		return new Promise((resolve, reject) => {
			const installCommand =
				process.platform === 'win32'
					? 'py -m pip install semgrep || python -m pip install semgrep'
					: 'python3 -m pip install semgrep';

			outputChannel.appendLine('Installing Semgrep...');
			outputChannel.appendLine(`Command: ${installCommand}`);
			outputChannel.show(true);

			exec(installCommand, (error, stdout, stderr) => {
				outputChannel.appendLine(stdout || '');
				outputChannel.appendLine(stderr || '');

				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}

	async function ensureSemgrepReady() {
		const isInstalled = await checkSemgrepInstalled();

		if (isInstalled) {
			outputChannel.appendLine('Semgrep is installed and ready.');
			return;
		}

		const action = await vscode.window.showWarningMessage(
			'Semgrep is not installed. It is required to run security scans.',
			'Install Semgrep'
		);

		if (action !== 'Install Semgrep') {
			return;
		}

		try {
			await installSemgrep();
			const installedNow = await checkSemgrepInstalled();

			if (installedNow) {
				vscode.window.showInformationMessage('Semgrep installed successfully.');
				outputChannel.appendLine('Semgrep installed successfully.');
			} else {
				vscode.window.showErrorMessage(
					'Semgrep installation finished, but Semgrep is still not available. Please restart VS Code.'
				);
			}
		} catch (error: any) {
			vscode.window.showErrorMessage(`Failed to install Semgrep: ${error.message}`);
		}
	}

	function runSemgrepScan(scanTarget: string, workingDirectory: string, label: string) {
		outputChannel.clear();
		outputChannel.appendLine('=== Vibe Coding Security Scan ===');
		outputChannel.appendLine(`Target: ${scanTarget}`);
		outputChannel.appendLine(`Rules: ${rulesPath}`);
		outputChannel.appendLine('');

		diagnosticCollection.clear();
		findingsProvider.clearFindings();

		vscode.window.showInformationMessage(`Running Semgrep on: ${label}`);

		execFile(
			'semgrep',
			['scan', '--config', rulesPath, '--json', scanTarget],
			{ cwd: workingDirectory },
			(error, stdout, stderr) => {
				if (error) {
					outputChannel.appendLine('Semgrep execution failed.');
					outputChannel.appendLine(stderr || error.message);
					outputChannel.show(true);
					vscode.window.showErrorMessage(`Semgrep failed: ${stderr || error.message}`);
					return;
				}

				try {
					const parsed = JSON.parse(stdout);
					const results = parsed.results || [];

					if (results.length === 0) {
						outputChannel.appendLine('No issues found.');
						outputChannel.show(true);
						findingsProvider.clearFindings();
						vscode.window.showInformationMessage(`No issues found in ${label}.`);
						return;
					}

					outputChannel.appendLine(`Total issues found: ${results.length}`);
					outputChannel.appendLine('');

					const diagnosticsByUri = new Map<string, vscode.Diagnostic[]>();
					const findings: FindingItem[] = [];

					results.forEach((result: any, index: number) => {
						const rawRuleId = result.check_id || 'unknown-rule';
						const cleanRuleId = String(rawRuleId).split('.').pop() || String(rawRuleId);
						const message = result.extra?.message || 'No message';
						const severityText = result.extra?.severity || 'UNKNOWN';

						const startLine = Math.max((result.start?.line || 1) - 1, 0);
						const startCol = Math.max((result.start?.col || 1) - 1, 0);
						const endLine = Math.max((result.end?.line || result.start?.line || 1) - 1, 0);
						const endCol = Math.max((result.end?.col || result.start?.col || 2) - 1, startCol + 1);

						const range = new vscode.Range(
							new vscode.Position(startLine, startCol),
							new vscode.Position(endLine, endCol)
						);

						let severity = vscode.DiagnosticSeverity.Warning;
						if (severityText === 'ERROR') {
							severity = vscode.DiagnosticSeverity.Error;
						} else if (severityText === 'INFO') {
							severity = vscode.DiagnosticSeverity.Information;
						} else if (severityText === 'WARNING') {
							severity = vscode.DiagnosticSeverity.Warning;
						}

						const resultPath = result.path
							? path.isAbsolute(result.path)
								? result.path
								: path.resolve(workingDirectory, result.path)
							: scanTarget;

						const uri = vscode.Uri.file(resultPath);
						const diagnostic = new vscode.Diagnostic(range, message, severity);
						diagnostic.source = 'Vibe Coding Security';
						diagnostic.code = cleanRuleId;

						const existing = diagnosticsByUri.get(uri.toString()) || [];
						existing.push(diagnostic);
						diagnosticsByUri.set(uri.toString(), existing);

						findings.push({
							file: path.basename(resultPath),
							fullPath: resultPath,
							rule: cleanRuleId,
							severity: severityText,
							line: result.start?.line || '?',
							message
						});

						outputChannel.appendLine(`Issue #${index + 1}`);
						outputChannel.appendLine(`File: ${resultPath}`);
						outputChannel.appendLine(`Rule: ${cleanRuleId}`);
						outputChannel.appendLine(`Severity: ${severityText}`);
						outputChannel.appendLine(`Line: ${result.start?.line || '?'}`);
						outputChannel.appendLine(`Message: ${message}`);
						outputChannel.appendLine('---');
					});

					for (const [uriString, diagnostics] of diagnosticsByUri.entries()) {
						diagnosticCollection.set(vscode.Uri.parse(uriString), diagnostics);
					}

					findingsProvider.setFindings(findings);

					outputChannel.show(true);
					vscode.window.showWarningMessage(
						`Semgrep found ${results.length} issue(s) in ${label}.`
					);
				} catch {
					outputChannel.appendLine('Failed to parse Semgrep JSON output.');
					outputChannel.show(true);
					vscode.window.showErrorMessage('Failed to parse Semgrep JSON output.');
				}
			}
		);
	}

	const scanCurrentFile = vscode.commands.registerCommand('vibe-coding-security.scanCurrentFile', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showWarningMessage('No file is currently open.');
			return;
		}

		const filePath = editor.document.fileName;
		const shortName = path.basename(filePath);
		runSemgrepScan(filePath, path.dirname(filePath), shortName);
	});

	const scanProject = vscode.commands.registerCommand('vibe-coding-security.scanProject', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is open.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		const projectName = workspaceFolders[0].name;
		runSemgrepScan(workspacePath, workspacePath, projectName);
	});

	const openFinding = vscode.commands.registerCommand(
		'vibe-coding-security.openFinding',
		async (finding: FindingItem) => {
			const details =
				`File: ${finding.file}\n` +
				`Rule: ${finding.rule}\n` +
				`Severity: ${finding.severity}\n` +
				`Line: ${finding.line}\n\n` +
				`${finding.message}`;

			const action = await vscode.window.showInformationMessage(
				details,
				{ modal: true },
				'Open File'
			);

			if (action !== 'Open File') {
				return;
			}

			if (!finding.fullPath) {
				vscode.window.showWarningMessage('No file path found for this issue.');
				return;
			}

			const document = await vscode.workspace.openTextDocument(finding.fullPath);
			const editor = await vscode.window.showTextDocument(document);

			const lineNumber =
				typeof finding.line === 'number' ? finding.line : parseInt(String(finding.line), 10);

			const targetLine = Math.max((lineNumber || 1) - 1, 0);
			const position = new vscode.Position(targetLine, 0);

			editor.selection = new vscode.Selection(position, position);
			editor.revealRange(
				new vscode.Range(position, position),
				vscode.TextEditorRevealType.InCenter
			);
		}
	);

	context.subscriptions.push(
		scanCurrentFile,
		scanProject,
		openFinding,
		outputChannel,
		diagnosticCollection
	);

	ensureSemgrepReady();
}

export function deactivate() {}
