const getGuid = require('uuid/v4');
const axios = require('axios');

async function globalCreateObject({appUrl, userCookie, newObjectData}) {
	if (!userCookie) {
		throw new Error("userCookie is not defined");
	} else if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!newObjectData) {
		throw new Error("newObjectData is not defined");
	} else if (!newObjectData.entityId) {
		throw new Error("newObjectData.entityId is not defined");
	}

	let newObjId = getGuid();
	await axios.post(appUrl + `rest/data/entity/` + newObjId, newObjectData, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
}

async function globalDeleteObjects({appUrl, userCookie, deleteObjectIds}) {
	if (!Array.isArray(deleteObjectIds)) {
		throw new Error("deleteObjectIds is not Array");
	}

	await axios.post(appUrl + `rest/data/deleteentity`, {
		"objectIds": deleteObjectIds
	}, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
}

async function globalGetObjects({appUrl, userCookie, searchParameters}) {
	if (!userCookie) {
		throw new Error("userCookie is not defined");
	} else if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!searchParameters) {
		throw new Error("searchParameters is not defined");
	} else if (!searchParameters.entityId) {
		throw new Error("searchParameters.entityId is not defined");
	} else if (searchParameters.attributes && !Array.isArray(searchParameters.attributes)) {
		throw new Error("searchParameters.attributes is not Array");
	} else if (!searchParameters.limit) {
		throw new Error("searchParameters.limit is not defined");
	}

	let searchObject = {};
	searchObject.entityId = searchParameters.entityId;
	searchObject.limit = searchParameters.limit;
	if (searchParameters.attributes) {
		searchObject.attributes = searchParameters.attributes;
	} else {
		searchObject.attributes = [];
	}
	if (searchParameters.dataCondition) {
		searchObject.useCondition = true;
		searchObject.dataCondition = searchParameters.dataCondition;
	} else {
		searchObject.useCondition = false;
	}
	if (searchParameters.DBSearch === true) {
		searchObject.bindType = "UML";
	} else {
		searchObject.bindType = "entity";
	}
	let searchResult = await axios.post(appUrl + `rest/data/entity/`, searchObject, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
	return searchResult.data;
}

async function globalGetForms({appUrl, userCookie}){
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!userCookie) {
		throw new Error("userCookie is not defined");
	}

	const {"data":{forms}} = await axios.get(appUrl + `rest/forms`, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});

	return forms;
}

async function globalGetVises({appUrl, userCookie}){
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!userCookie) {
		throw new Error("userCookie is not defined");
	}

	const {"data":vises} = await axios.get(appUrl + `rest/vis`, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
	return vises;
}

async function globalGetUMLSchema({appUrl, userCookie}){
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!userCookie) {
		throw new Error("userCookie is not defined");
	}

	const {"data": UMLSchema} = await axios.get(appUrl + `rest/entityspec`, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
	return UMLSchema;
}

async function globalLogin({appUrl, username, password}) {
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!username) {
		throw new Error("username is not defined");
	} else if (!password) {
		throw new Error("password is not defined");
	}

	let loginData = await axios.post(appUrl + `rest/login`, {username, password}, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8"
		}
	});
	let RawUserCookie = loginData.headers["set-cookie"][0],
		UserCookie = RawUserCookie.substring(0, RawUserCookie.indexOf(";"));

	return UserCookie;
}

async function globalCheckCookie({appUrl, userCookie}) {
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!userCookie) {
		throw new Error("userCookie is not defined");
	}

	let checkCookieResult = true;
	try {
		await axios.head(appUrl + `rest/profile`, {
			headers: {
				"Cookie": userCookie
			}
		});
	} catch (err) {
		console.error(err);
		checkCookieResult = false;
	}

	return checkCookieResult;
}

function globalCookieManager({loginFunction, checkCookieFunction}){
	async function refreshCookie() {
		cookie = await loginFunction();
		return cookie;
	}

	let cookie = null;

	this.getCookie = function() {
		return cookie;
	}
	this.getActualCookie = async function() {
		if (!cookie) {
			return await refreshCookie();
		} else {
			let checkCookieResult = await checkCookieFunction(cookie);
			if (checkCookieResult === true) {
				return cookie;
			} else {
				return await refreshCookie();
			}
		}
	}
	this.refreshCookie = refreshCookie;
}

function DigitApp({appUrl, username, password}){
	const CookieManager = new globalCookieManager({
		"loginFunction": login, 
		"checkCookieFunction": checkCookie
	});
	function login(){
		return globalLogin({
			appUrl: appUrl,
			username,
			password
		});
	}
	function checkCookie(userCookie){
		return globalCheckCookie({
			appUrl: appUrl,
			userCookie
		});
	}

	this.createObject = async function createObject(newObjectData) {
		const userCookie = await CookieManager.getActualCookie();
		await globalCreateObject({
			appUrl: appUrl,
			userCookie, 
			newObjectData
		});
	}
	this.getObjects = async function getObjects(searchParameters) {
		const userCookie = await CookieManager.getActualCookie();
		return await globalGetObjects({
			appUrl: appUrl,
			userCookie, 
			searchParameters
		});
	}
	this.deleteObjects = async function deleteObjects(deleteObjectIds) {
		const userCookie = await CookieManager.getActualCookie();
		await globalDeleteObjects({
			appUrl: appUrl,
			userCookie, 
			deleteObjectIds
		});
	}
	this.getForms = async function getForms(){
		const userCookie = await CookieManager.getActualCookie();
		return await globalGetForms({
			appUrl: appUrl,
			userCookie
		});
	}
	this.getVises = async function getVises(){
		const userCookie = await CookieManager.getActualCookie();
		return await globalGetVises({
			appUrl: appUrl,
			userCookie
		});
	}
	this.getUMLSchema = async function getUMLSchema(){
		const userCookie = await CookieManager.getActualCookie();
		return await globalGetUMLSchema({
			appUrl: appUrl,
			userCookie
		});
	}
}

module.exports.DigitApp = DigitApp;