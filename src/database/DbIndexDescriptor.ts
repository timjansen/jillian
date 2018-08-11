

export default interface DbIndexDescriptor {
	type: 'category';
	property: string;        // the name of the property to index
	includeParents: boolean; // used only for Categories: if true, all parent categories shall be indexed as well
}