
export default interface SerializablePrimitive {
	// returns a serialized string, or undefined if regular object serialization should be used
	serializeToString(pretty: boolean, indent: number, spaces: string, serializer: (object: any, pretty: boolean, indent: number, spaces: string)=>string): string | undefined;
}
