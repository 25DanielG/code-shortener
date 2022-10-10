import { removeAllListeners } from 'process';
import * as vscode from 'vscode';
const editor = vscode.window.activeTextEditor;
var startBlockComments: number[] = [];
var endBlockComments: number[] = [];
var spaceBeforeBracePref = 1;
let preDoc = editor?.document.getText();
export async function activate(context: vscode.ExtensionContext) {
	console.log('Code Shortener is currently active!');
	if(editor && (editor.document.fileName.includes(".java"))) {
		editor.edit(editBuilder => {
			const firstLine = editor.document.lineAt(0);
			const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
			const range = new vscode.Range(firstLine.lineNumber, firstLine.range.start.character, lastLine.lineNumber, lastLine.range.end.character);
			if(preDoc !== undefined) {
				let preDoc = preprocess();
				if(preDoc !== undefined) {
					editBuilder.replace(range, preDoc);
					console.log("Preprocessed editor.");
				}
			}
		});
	} else {
		vscode.window.showInformationMessage("No active editor open or editor is not a .java.");
	}
	let disposable = vscode.commands.registerCommand('code-shortener.removeEmptyLines', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor && (editor.document.fileName.includes(".java"))) {
			editor.edit(editBuilder => {
				const firstLine = editor.document.lineAt(0);
				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				const range = new vscode.Range(firstLine.lineNumber, firstLine.range.start.character, lastLine.lineNumber, lastLine.range.end.character);
				let word = editor.document.getText();
				let newWord: string = removeEmptyLines(word);
				editBuilder.replace(range, newWord);
			});
		} else {
			vscode.window.showInformationMessage("No active editor open or editor is not a .java.");
		}
	});
	/*let disposable2 = vscode.commands.registerCommand('code-shortener.combineVarDeclarations', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor && (editor.document.fileName.includes(".java"))) {
			editor.edit(editBuilder => {
				const firstLine = editor.document.lineAt(0);
				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				const range = new vscode.Range(firstLine.lineNumber, firstLine.range.start.character, lastLine.lineNumber, lastLine.range.end.character);
				let word = editor.document.getText();
				let newWord: string = putVariablesOnOneLine(word);
				editBuilder.replace(range, newWord);
			});
		} else {
			vscode.window.showInformationMessage("No active editor open or editor is not a .java.");
		}
	});*/
	let disposable3 = vscode.commands.registerCommand('code-shortener.putBracesOnSameLine', () => {
		const editor = vscode.window.activeTextEditor;
		if(editor && (editor.document.fileName.includes(".java"))) {
			editor.edit(editBuilder => {
				const firstLine = editor.document.lineAt(0);
				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				const range = new vscode.Range(firstLine.lineNumber, firstLine.range.start.character, lastLine.lineNumber, lastLine.range.end.character);
				let word = editor.document.getText();
				let newWord: string = putBracesOnSameLine(word);
				editBuilder.replace(range, newWord);
			});
		} else {
			vscode.window.showInformationMessage("No active editor open or editor is not a .java.");
		}
	});
	let disposable4 = vscode.commands.registerCommand('code-shortener.selectBraceSpacePreference', () => {
		const choices = ["1", "2", "3", "4"];
		let tmp;
		return new Promise((resolve) => {
			const quickPick = vscode.window.createQuickPick();
			quickPick.items = choices.map(choice => ({ label: choice }));
			quickPick.title = 'Select your space preceeding brace preference:';
			quickPick.onDidChangeValue(() => {
				if (!choices.includes(quickPick.value)) quickPick.items = [quickPick.value, ...choices].map(label => ({ label }));
			});
			quickPick.onDidAccept(() => {
				const selection = quickPick.activeItems[0];
				tmp = selection.label;
				resolve(selection.label);
				if(tmp !== undefined) {
					spaceBeforeBracePref = +tmp;
				} else {
					vscode.window.showInformationMessage("Pick a search query to change the space preceeding brace preference.");
					return;
				}
				vscode.window.showInformationMessage("Changed your space preceeding brace preference to: " + spaceBeforeBracePref);
				quickPick.hide();
			});
			quickPick.show();
		});
	});
	context.subscriptions.push(disposable);
	//context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
}
function removeEmptyLines(word: string) {
	let allLines: string[] = word.split('\n');
	for(let i = 0; i < allLines.length; ++i) {
		if(allLines[i].trim().length === 0) {
			allLines.splice(i, 1);
			--i;
		}
	}
	let newWord: string = allLines.join('\n');
	return newWord;
}
function putBracesOnSameLine(word: string) {
	let allLines: string[] = word.split('\n');
	let newAllLines: string[] = [];
	let tmpStr: string = "";
	for(let i = 0; i < spaceBeforeBracePref; ++i) {
		tmpStr += " ";
	}
	for(let i = 0; i < allLines.length; ++i) {
		if(!onlyOpenBrace(allLines[i])) {
			newAllLines.push(allLines[i]);
		} else {
			while(newAllLines[newAllLines.length - 1].charAt(newAllLines[newAllLines.length - 1].length - 1) === " ") {
				console.log("Removed brace at line: " + i);
				newAllLines[newAllLines.length - 1] = newAllLines[newAllLines.length - 1].slice(0, newAllLines[newAllLines.length - 1].length - 1);
			}
			newAllLines[newAllLines.length - 1] += tmpStr + "{";
		}
	}
	let newWord = newAllLines.join('\n');
	return newWord;
}
function putVariablesOnOneLine(word: string) {
	let allLines: string[] = word.split('\n');
	for(let i = 0; i < allLines.length; ++i) {
		if(allLines[i].includes(VariableKeywords.byte) || allLines[i].includes(VariableKeywords.short) || allLines[i].includes(VariableKeywords.int)
		|| allLines[i].includes(VariableKeywords.long) || allLines[i].includes(VariableKeywords.float) || allLines[i].includes(VariableKeywords.double)
		|| allLines[i].includes(VariableKeywords.char) || allLines[i].includes(VariableKeywords.boolean)) {
			
		}
	}
}
function outlineProperIndent(allLines: string[], indentPref: number) {
	let indentPushNum: number = 0;
	let indentTrackerArr = new Array<number>();
	preprocessBlockComments(allLines);
	for(let i = 0; i < allLines.length; ++i) {
		let currentLine: string = allLines[i];
		indentTrackerArr.push(indentPushNum);
		if(includeExcludingComment(currentLine, i, "class ") || (includeExcludingComment(currentLine, i, "final ") && !includeExcludingComment(currentLine, i, ";"))) {
			++indentPushNum;
		} else if((includeExcludingComment(currentLine, i, "private ") || includeExcludingComment(currentLine, i, "public ") || includeExcludingComment(currentLine, i, "protected "))) {
			if(!includeExcludingComment(currentLine, i, ";") && !includeExcludingComment(currentLine, i, "=")) {
				++indentPushNum;
			}
		} else if(includeExcludingComment(currentLine, i, "for(") || includeExcludingComment(currentLine, i, "while(") || includeExcludingComment(currentLine, i, "if(") || includeExcludingComment(currentLine, i, "else ")) {
			++indentPushNum;
		} else if(includeExcludingComment(currentLine, i, "do") || includeExcludingComment(currentLine, i, "else{")) {
			++indentPushNum;
		}
		if(includeExcludingComment(currentLine, i, "}") && !includeExcludingComment(currentLine, i, "{")) {
			--indentPushNum;
		}
	}
	return indentTrackerArr;
}
function preprocessBlockComments(allLines: string[]) {
	let toSearchOne: string = "/*";
	let toSearchTwo: string = "*/";
	var tmpStartComments: number[] = [];
	var tmpEndComments: number[] = [];
	for(let i = 0; i < allLines.length; ++i) {
		if(allLines[i].includes(toSearchOne)) {
			tmpStartComments.push(i);
		}
		if(allLines[i].includes(toSearchTwo)) {
			tmpEndComments.push(i);
		}
	}
	startBlockComments = tmpStartComments;
	endBlockComments = tmpEndComments;
}
function preprocess() {
	if(preDoc === undefined) return;
	preDoc = preDoc.replaceAll('\t', '  ');
	let allLines = preDoc.split('\n');
	for(let i = 0; i < allLines.length; ++i) {
		if(allLines[i].trim().length === 0) {
			allLines.splice(i, 1);
			--i;
		}
		preprocessBlockComments(allLines);
	}
	let newWord:string = allLines.join('\n');
	newWord = newWord.replace("@ author", "@author");
	newWord = newWord.replace("@Author", "@author");
	newWord = newWord.replace("@ version", "@version");
	newWord = newWord.replace("@Version", "@version");
	newWord = newWord.replace("@ description", "@description");
	newWord = newWord.replace("@Description", "@description");
	return newWord;
}
function includeExcludingComment(str: string, cnt: number, toFind: string) {
	if(str.includes(toFind)) {
		let indexOf = str.indexOf(toFind);
		let insideSingleComment: boolean = false;
		if(str.includes("//")) {
			let indexOfSlash: number = str.indexOf("//");
			if(indexOf > indexOfSlash) return false;
		}
		for(let i = 0; i < startBlockComments.length; ++i) {
			if(cnt > startBlockComments[i] && cnt < endBlockComments[i]) {
				return false;
			} else if(cnt === startBlockComments[i] && cnt === endBlockComments[i]) {
				if(indexOf > str.indexOf("/*") && indexOf < str.indexOf("*/")) return false;
			} else if(cnt === startBlockComments[i]) {
				if(indexOf > str.indexOf("/*")) return false;
			} else if(cnt === endBlockComments[i]) {
				if(indexOf < str.indexOf("/*")) return false;
			}
		}
		return true;
	}
	return false;
}
function onlyOpenBrace(strLine: string) {
	for(let i = 0; i < strLine.length; ++i) {
		if(strLine[i] !== ' ' && strLine[i] !== '{') {
			return false;
		} else if(strLine[i] === '{') {
			return true;
		}
	}
}
enum VariableKeywords {
	byte = "byte",
	short = "short",
	int = "int",
	long = "long",
	float = "float",
	double = "double",
	char = "char",
	boolean = "boolean"
}