// Imports
const nopt = require('nopt');
const path = require('path');
const fs = require('fs');

const baseSymbols = {
    SP: 0,
    LCL: 1,
    ARG: 2,
    THIS: 3,
    THAT: 4,
    R0: 0,
    R1: 1,
    R2: 2,
    R3: 3,
    R4: 4,
    R5: 5,
    R6: 6,
    R7: 7,
    R8: 8,
    R9: 9,
    R10: 10,
    R11: 11,
    R12: 12,
    R13: 13,
    R14: 14,
    R15: 15,
    SCREEN: 16384,
    KBD: 24576,
};
const ops = {
    0: '101010',
    1: '111111',
    '-1': '111010',
    D: '001100',
    A: '110000',
    '!D': '001101',
    '!A': '110001',
    '-D': '001111',
    '-A': '110011',
    'D+1': '011111',
    'A+1': '110111',
    'D-1': '001110',
    'A-1': '110010',
    'D+A': '000010',
    'D-A': '010011',
    'A-D': '000111',
    'D&A': '000000',
    'D|A': '010101',
}
const jump = {
    undefined: "000",
    JGT: "001",
    JEQ: "010",
    JGE: "011",
    JLT: "100",
    JNE: "101",
    JLE: "110",
    JMP: "111"
}
const dest = {
    "undefined": "000",
    "M": "001",
    "D": "010",
    "A": "100",
    "AM": "101",
    "AD": "110",
    "MD": "011",
    "AMD": "111"
}

function getParsedOptions() {
    const options = {
        'file': path,
        'symbol': Boolean
    }
    const shortHands = {
        'f': ['--file'],
        's': ['--symbol']
    }

    return nopt(options, shortHands);
}

function removeWhitespace(lines) {
    return lines.reduce((prev, line) => {
        if (line.length === 0 || line.startsWith('//')) {
            return prev
        }
        cleanLine = line.split('//')[0].trim();
        prev.push(cleanLine);
        return prev;
    }, [])
}

function extractLabels(lines) {
    const symbols = Object.assign({}, baseSymbols);

    let labelCount = 0

    const newLines = lines.reduce((prev, line, lineNum) => {
        const matches = line.match(/\((.*)\)/);
        const label = matches ? matches[1] : undefined;
        if (label) {
            if (!symbols[label]) {
                symbols[label] = lineNum - (labelCount++);
                return prev
            }
            throw new Error(`Symbol already exists, ${label} at ${lineNum}`);
        }
        prev.push(line);
        return prev;
    }, [])

    return {
        symbols,
        lines: newLines
    };
}

function replaceSymbols(lines, _symbols) {
    const symbols = Object.assign({}, _symbols);

    let nextSymbol = 16

    lines.forEach((line, lineNum) => {
        const charCode = line.charCodeAt(1)
        if (line.startsWith('@') && (charCode < 48 || charCode > 57)) {
            const symbol = line.slice(1);
            const test = symbols[symbol];
            if (symbols[symbol] === undefined) {
                symbols[symbol] = nextSymbol++;
            }
        }
    })

    const machineLines = lines.map((line, lineNum) => {
        if (line.startsWith('@')) {
            if (line.charCodeAt(1) < 48 || line.charCodeAt(1) > 57) {
                const symbol = line.slice(1);
                return `@${symbols[symbol]}`;
            }
        }
        return line;
    })

    return {
        symbols,
        lines: machineLines
    };
}

function translateLine(line) {
    if (line.startsWith('@')) {
        const binaryValue = parseInt(line.slice(1), 10).toString(2);
        const paddedValue = `${"0".repeat(15 - binaryValue.length)}${binaryValue}`
        return `0${paddedValue}`
    }
    let a = 0;
    const [rest, jmp] = line.split(";");
    let [instruction, assignment] = rest.split("=").reverse();
    if (instruction.search("M") !== -1) {
        a = 1;
        instruction = instruction.replace("M", "A");
    }
    return `111${a}${ops[instruction]}${dest[assignment]}${jump[jmp]}`;
}

const {file: fileName, symbol: showSymbols} = getParsedOptions();
const fileContent = fs.readFileSync(fileName).toString();
const fileLines = fileContent.split(/\n|\r\n/);
const whiteSpaceRemovedLines = removeWhitespace(fileLines);
const {lines: noLabelLines, symbols: partialSymbols} = extractLabels(whiteSpaceRemovedLines)
const {lines: noSymbolLines, symbols} = replaceSymbols(noLabelLines, partialSymbols);
fs.writeFileSync(`${fileName.split('.')[0]}.hack`,noSymbolLines.map(translateLine).join('\n'));
if(showSymbols) console.log(symbols);
// console.log(noSymbolLines);
// console.log();