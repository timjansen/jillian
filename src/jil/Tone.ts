import JelType from '../jel/JelType';

// Describes meta-attributes of a sentence such as politeness
export default class Tone extends JelType {
  // positive is polite, negative is rude
  constructor(public politeRude: number) {
    super();
  }
}
