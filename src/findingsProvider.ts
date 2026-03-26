import * as vscode from 'vscode';

export interface FindingItem {
	file: string;
	fullPath?: string;
	rule: string;
	severity: string;
	line: number | string;
	message: string;
}

class FileGroupItem extends vscode.TreeItem {
	constructor(
		public readonly fileName: string,
		public readonly findings: FindingItem[]
	) {
		super(`${fileName} (${findings.length})`, vscode.TreeItemCollapsibleState.Expanded);
		this.description = findings.length === 1 ? '1 issue' : `${findings.length} issues`;
		this.tooltip = `${fileName}\n${this.description}`;
		this.iconPath = new vscode.ThemeIcon('file');
	}
}

class FindingTreeItem extends vscode.TreeItem {
	constructor(public readonly finding: FindingItem) {
		super(
			`${finding.severity} | ${finding.rule} | Line ${finding.line}`,
			vscode.TreeItemCollapsibleState.None
		);

		this.description = finding.message;
		this.tooltip =
			`File: ${finding.file}\n` +
			`Rule: ${finding.rule}\n` +
			`Severity: ${finding.severity}\n` +
			`Line: ${finding.line}\n` +
			`Message: ${finding.message}`;

		this.command = {
			command: 'vibe-coding-security.openFinding',
			title: 'Open Finding',
			arguments: [finding]
		};

		if (finding.severity === 'ERROR') {
			this.iconPath = new vscode.ThemeIcon('error');
		} else if (finding.severity === 'WARNING') {
			this.iconPath = new vscode.ThemeIcon('warning');
		} else {
			this.iconPath = new vscode.ThemeIcon('info');
		}
	}
}

export class FindingsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> =
		new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> =
		this._onDidChangeTreeData.event;

	private findings: FindingItem[] = [];

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	setFindings(findings: FindingItem[]): void {
		this.findings = findings;
		this.refresh();
	}

	clearFindings(): void {
		this.findings = [];
		this.refresh();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (this.findings.length === 0) {
			const emptyItem = new vscode.TreeItem('No findings yet');
			emptyItem.description = 'Run a scan to see results';
			emptyItem.iconPath = new vscode.ThemeIcon('search');
			return [emptyItem];
		}

		if (!element) {
			const grouped = new Map<string, FindingItem[]>();

			for (const finding of this.findings) {
				const existing = grouped.get(finding.file) || [];
				existing.push(finding);
				grouped.set(finding.file, existing);
			}

			return Array.from(grouped.entries()).map(
				([fileName, findings]) => new FileGroupItem(fileName, findings)
			);
		}

		if (element instanceof FileGroupItem) {
			return element.findings.map((finding) => new FindingTreeItem(finding));
		}

		return [];
	}
}