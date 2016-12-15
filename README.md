# HACK Assembler
This program assembles HACK assembly langauge files (`.asm`) into HACK machine code files (`.hack`).
## Running
To run the assembler use the following command `node index.js -f $filename` where `$filename` is the file to be assembled.  Passing the flag `--symbol`, `-s` for short, will log out the symbol table constructed during assembly.