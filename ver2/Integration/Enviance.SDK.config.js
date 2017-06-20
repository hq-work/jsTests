var testSystemId = null;
(function() {
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else { // code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.open("GET", location.protocol + "//" + location.host + "/" + "test/Web.config", false);
	xmlhttp.send();
	var xmlString = xmlhttp.responseText;

	if (window.DOMParser) {
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(xmlString, "text/xml");
	} else // Internet Explorer
	{
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(xmlString);
	}

	var _webAppVirtualPath = xmlDoc.getElementsByTagName("configuration")[0]
									.getElementsByTagName("appSettings")[0]
									.getElementsByTagName("add")[0]
									.getAttribute("value");
	testSystemId = xmlDoc.getElementsByTagName("configuration")[0]
									.getElementsByTagName("appSettings")[0]
									.getElementsByTagName("add")[1]
									.getAttribute("value");
	var _baseAddress = xmlDoc.getElementsByTagName("configuration")[0]
									.getElementsByTagName("appSettings")[0]
									.getElementsByTagName("add")[2]
									.getAttribute("value");

	envianceSdk.configure({
		baseAddress: _baseAddress,
		webAppVirtualPath: _webAppVirtualPath,
		crossDomainWorkaround: "ifneeded",
		systemId: testSystemId
	});
})();