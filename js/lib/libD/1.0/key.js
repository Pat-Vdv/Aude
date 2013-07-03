// This function will simulate user text input on a givern node
// is oneEventIsAcceptable, libD can send only one event, at the end of input
// This allow faster code in case events for each char doesn't need to fire.
// oneEventIsAcceptable behavior is not implemented yet.
libD.sendText(node, text, oneEventIsAcceptable)
{
	for(var i=0,len=text.length; i<len; ++i)
	{
		libD.sendKey(node, libD.charToKey[text[i]] || 0, text[i]);
	}
}

libD.sendKey(node, keyCode, charCode, alt,)
{
	var e = document.createEvent("KeyboardEvent");
	event.initKeyEvent (type, bubbles, cancelable, viewArg, 
                        ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg, 
                        keyCodeArg, charCodeArg) 
	if(e.initKeyboardEvent)
	{
		e.initKeyboardEvent("keypress", true, true, null, in DOMString charArg, in DOMString keyArg, in unsigned long locationArg, in DOMString modifiersListArg, in boolean repeat, in DOMString localeArg);
}



libD.charToKey = {
	"	"	: 9,
	"\n"		: 13,
	" "		: 27,
	"0"		: 48,
	"1"		: 49,
	"2"		: 50,
	"3"		: 51,
	"4"		: 52,
	"5"		: 53,
	"6"		: 54,
	"7"		: 55,
	"8"		: 56,
	"9"		: 57,
	";"		: 59,
	"a"		: 65,
	"b"		: 66,
	"c"		: 67,
	"d"		: 68,
	"e"		: 69,
	"f"		: 70,
	"g"		: 71,
	"h"		: 72,
	"i"		: 73,
	"j"		: 74,
	"k"		: 75,
	"l"		: 76,
	"m"		: 77,
	"n"		: 78,
	"o"		: 79,
	"p"		: 80,
	"q"		: 81,
	"r"		: 82,
	"s"		: 83,
	"t"		: 84,
	"u"		: 85,
	"v"		: 86,
	"w"		: 87,
	"x"		: 88,
	"y"		: 89,
	"z"		: 90,
	"*"		: 106,
	"+"		: 107,
	"."		: 190,
	"/"		: 191,
	"`"		: 192,
	","		: 188,
	"["		: 219,
	"]"		: 221,
	'"'		: 192,
	"\"		: 222,
	"="		: 61
}; // based on https://developer.mozilla.org/en/DOM/KeyboardEvent#Virtual_key_codes