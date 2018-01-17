import JelType from '../../jel/JelType';



export default abstract class Fact extends JelType {
  
  constructor() {
    super();
  }
  
/*
   - ID (unique to containing object)
	 - reference to source Transcript
	 - reference to Transcript line
	 - source(s)
	 - type (fact, estimate, guess, measurement, theory...)
	 - trust level (0-100). 100 is Fact by root. trust level is limited based on type, e.g. guess is <=10, theory is <=80.
	 - reality
	 - start-time (can be range if exact number unknown)
	 - end-time (can be range)
	 - duration (if can be Range of UnitValue or DurationRange if not exactly known)

	   - value, or
		 - formular function f(this), or
		 - assertion function f(this)

*/
}




