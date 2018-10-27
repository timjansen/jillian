import JelObject from '../jel/JelObject';

// Describes meta-attributes of a sentence such as politeness
export default class Tone extends JelObject {
  // positive is polite, negative is rude
  constructor(public politeRude: number) {
    super();
  }
}
