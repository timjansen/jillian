// For those JelNodes that declare something in the program.
export default interface DeclaringStatement {
    isDeclaringStatement: boolean;
    name: string|undefined; // undefined == returns a Dictionary with multiple defs
}