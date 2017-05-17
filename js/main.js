var interVal = 100;
$(document).ready(function() {
	//$("#includedContent").load("/_layouts/usergroup/userGroup.html",main);
	$("#content2").tablesorter();
	$("#content").tablesorter();
	$("#url").html("<a href='"+window.location.origin+"'>"+window.location.hostname+"</a>");

	$("#userSearch").on('click', function(event) {
		event.preventDefault();
		$("#tbUsers").empty();
		var allSearchAjax = [], op = 0;
		$("#wait").show();
		$.each($('textarea[psname$=user]').val().split(/\n/), function (i, line) {
			if (line){
				setTimeout(function(){
					allSearchAjax.push(usersSearch(line));
				}, op);
				op+=interVal;
			}
		});
		setTimeout(function(){
			$.when.apply($, allSearchAjax).then(function() {
				$("#content").trigger("update"); 
				$("#content").find("th:contains(NAZWA)").trigger("sort");
				$("#wait").hide();
			},function(error) {
				$("#wait").hide();
			});
		}, op);	
	});
	$("#groupSearch").on('click', function(event) {
		event.preventDefault();
		$("#tbGroups").empty();
		var allSearchAjax = [], op = 0;
		$("#wait").show();
		$.each($('textarea[psname$=group]').val().split(/\n/), function (i, line) {
			if (line){
				setTimeout(function(){
					allSearchAjax.push(getAllGroups(line));
				}, op);
				op+=interVal;
			}
		});
		setTimeout(function(){
			$.when.apply($, allSearchAjax).then(function() {
				$("#content2").trigger("update"); 
				$("#content2").find("th:contains(NAZWA)").trigger("sort");
				$("#wait").hide();
			},function(error) {
				$("#wait").hide();
			});
		}, op);
	});

	$("#zamienIN").on('click', function(event) {
		event.preventDefault();
		var lines = [];
    	var convLines=[];
	    $.each($("textarea[psname$=user]").val().split(/\n/), function (i, line) {
	        if (line)lines.push(line);
	    });
	    for(var i = 0;i<lines.length;i++){
		    if (lines[i].indexOf(' ') > -1){
		        var splited = lines[i].split(' ');
		        convLines.push(splited[1]+" "+splited[0]);
		    }
		    else convLines.push(lines[i]);
	    }
	    $("textarea[psname$=user]").val(convLines.join("\n"));
	});	

	$("#addUsersToGroups").on('click', function(event) {
		event.preventDefault();
		var usersXML = selectedUsersCollection();
		var allSearchAjax = [], op=0;
		$("#wait").show();
		$('input[id^=trch2]:checked').each(function(index, el) {
			setTimeout(function(){
				allSearchAjax.push(addUsersCollectionToGroup($(el).attr('groupName'),usersXML));
			}, op);
			op+=interVal;
		});
		setTimeout(function(){
			$.when.apply($, allSearchAjax).then(function() {
				$("#userSearch").trigger( "click" );
			},function(error) {
				$("#wait").hide();
			});
		}, op);
	});

    $("#alltrch1").on('click', function(){
        $('input[id^=trch1]').prop('checked', $(this).is(':checked'));
    });
    $("#alltrch2").on('click', function(){
        $('input[id^=trch2]').prop('checked', $(this).is(':checked'));
    });

    //Utworzenie listy do logów jeśli nie istnieje
    $("#wait").show();
	$SP().webService({ 
		service:"Lists",
		operation:"GetListCollection",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/"
	}).then(function(response) {
		//console.log(response);
		var logListExist = false;
		$(response).find("List").each(function(){
			var listName =$(this).attr("Title");
			if (listName == "Logs")logListExist = true;
		});
	  	if(!logListExist)
	  		$SP().webService({ 
				service:"Lists",
				operation:"AddList",
				soapURL:"http://schemas.microsoft.com/sharepoint/soap/",
				properties:{
	    			listName: "Logs",
					description: "List for operations loging.",
					templateID: 100
	  			}
			}).then(function(response) {
		  		setMessage("Utwrzono listę logów.", true);
		  		$("#wait").hide();
			},function(error) { 
				setMessage("Error: "+error, false); 
				$("#wait").hide();
				console.log(error);
			});
	  	else $("#wait").hide();
	},function(error) { 
		setMessage("Error: "+error, false); 
		$("#wait").hide();
		console.log(error);
	});
	///////////////////////////////////////////////////

});

function usersSearch(line){
	return $SP().webService({ 
		service:"People",
	  	operation:"SearchPrincipals",
	  	soapURL:"http://schemas.microsoft.com/sharepoint/soap/",
	  	properties:{
    		searchText: line,
			maxResults: 100,
			principalType: "User"
  		}
	}).then(function(response) {
	  	var people = [];
	  	$(response).find("PrincipalInfo").each(function(index, el) {
	  		var splitedLogin = $(el).find("AccountName").text().split("\\");
			var onlyDomain = splitedLogin[0];
			var onlyLogin = splitedLogin[1];
	  		people.push({
	  			AccountName: $(el).find("AccountName").text(),
	  			UserInfoID: $(el).find("UserInfoID").text(),
	  			DisplayName: $(el).find("DisplayName").text(),
	  			Email: $(el).find("Email").text(),
	  			Department: $(el).find("Department").text(),
	  			Title: $(el).find("Title").text(),
	  			AccountName2: onlyDomain+'\\\\'+onlyLogin
	  		})
	  	});
		if (people.length == 0)setMessage("Nie znaleziono: "+line, false);
		var peopleInGroups = $.grep(people,function(el,i){
			return ( el.UserInfoID != -1);
		});
		var trUser = "";
		for (var i=0; i < peopleInGroups.length; i++) {
			trUser+="<tr id="+peopleInGroups[i].UserInfoID+">"+
			"<td><input type='checkbox' id='trch1' login='"+peopleInGroups[i].AccountName+"' login2='"+peopleInGroups[i].AccountName2+"' name='"+peopleInGroups[i].DisplayName+"' email='"+peopleInGroups[i].Email+"'></td>"+
			"<td>"+peopleInGroups[i].UserInfoID+"</td>"+
			"<td><a href='/_layouts/userdisp.aspx?ID="+peopleInGroups[i].UserInfoID+"' target='_blank'>" + peopleInGroups[i].DisplayName + "</a></td>"+
			"<td>"+peopleInGroups[i].AccountName+"</td>"+
			'<td><img id="wait'+peopleInGroups[i].UserInfoID+'" src="img/wait.gif" alt="loading..." class="pull-right img-responsive"></td>'+
			"</tr>";
	  	}
	  	if($("#caleAd").is(":checked")){
	  		var peopleNotInGroups = $.grep(people,function(el,i){
				return ( el.UserInfoID == -1);
			});
			for (var i=0; i < peopleNotInGroups.length; i++) {
			trUser+="<tr id="+peopleNotInGroups[i].UserInfoID+">"+
			"<td><input type='checkbox' id='trch1' login='"+peopleNotInGroups[i].AccountName+"' login2='"+peopleNotInGroups[i].AccountName2+"' name='"+peopleNotInGroups[i].DisplayName+"' email='"+peopleNotInGroups[i].Email+"'></td>"+
			"<td>"+peopleNotInGroups[i].UserInfoID+"</td>"+
			"<td>" + peopleNotInGroups[i].DisplayName + "</td>"+
			"<td>"+peopleNotInGroups[i].AccountName+"</td>"+
			'<td></td>'+
			"</tr>";
			}
	  	}
	  	$("#tbUsers").append(trUser);
		for (var i=0; i < peopleInGroups.length; i++) {
			getGroups(peopleInGroups[i].AccountName, peopleInGroups[i].UserInfoID);
		}
	},function(error) { 
		setMessage("Error: "+error, true);
		console.log(error);
	}); 
}

function getGroups(login,userId){
 	return $SP().webService({
		service:"UserGroup",
		operation:"GetGroupCollectionFromUser",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
		properties:{
			userLoginName: login
		}
	}).then(function(response) {
		var sgroups = $('<ul class="list-group" id="g'+userId+'">');
		var sgroupsLi = ''; var userGroups=[];
		var i = 0;
		var splitedLogin = login.split("\\");
		var onlyDomain = splitedLogin[0];
		var onlyLogin = splitedLogin[1];
		$(response).find("Group").each(function(){
			var cGroupName = $(this).attr("Name");
			sgroupsLi += '<li class="list-group-item"><small>'+cGroupName+'</small>'+
			'<button class="btn btn-danger btn-xs" onclick="rmUserFromGroup(\''+onlyDomain+'\\\\'+onlyLogin+'\',\''+cGroupName+'\');$(this).parent().remove();return false;"><small>x</small></button>'+
			'<button class="btn btn-success btn-xs" onclick="event.preventDefault();addUsersCollectionToGroup(\''+cGroupName+'\',selectedUsersCollection()).then(function(response) {$(\'#userSearch\').trigger(\'click\');});return false;"><small>></small></button></li>';
			userGroups.push(cGroupName);
			i++;
		});
		if (i>0){
			sgroupsLi +='<li class="list-group-item"><button class="btn btn-danger btn-xs" id="dlg'+userId+'"><small>Usuń z tych grup</small></button>'+
			'<button class="btn btn-success btn-xs" id="addg'+userId+'"><small>Dodaj zaz. do tych grup</small></button></li>';
		}
		sgroups.html(sgroupsLi);
		$("#"+userId+" td:last").html(sgroups);
		if (i>0){
			$("#dlg"+userId).on('click', function(event) {
				event.preventDefault();
				if(confirm("Czy napewno chcesz usunąć usera "+login+" z wszystkich grup ?")){
					var allSearchAjax = [],j=0;
					$("#wait").show();
					//for (var j=0; j < userGroups.length; j++) {
					var inter = setInterval(function () {
						allSearchAjax.push(rmUserFromGroup(login,userGroups[j]));
						j+=1;
						if(j==userGroups.length){
							$.when.apply($, allSearchAjax).then(function() {
								$("#wait").hide();
								$("#g"+userId).remove();
							},function(error) {
								$("#wait").hide();
							});
							clearInterval(inter);
						}
					},interVal);
				}
			});
			$("#addg"+userId).on('click', function(event) {
				event.preventDefault();
				if(confirm("Czy napewno chcesz doda zaznaczonuch do wszystkich grup usera "+login+" ?")){
					var allSearchAjax = [],k=0;
					$("#wait").show();
					var usersXML = selectedUsersCollection();
					//for (var k=0; k < userGroups.length; k++) {
					var inter = setInterval(function () {
						allSearchAjax.push(addUsersCollectionToGroup(userGroups[k],usersXML));
						k+=1;
						if(k==userGroups.length){
							$.when.apply($, allSearchAjax).then(function() {
								$("#userSearch").trigger( "click" );
							},function(error) {
								$("#wait").hide();
							});
							clearInterval(inter);
						}
					},interVal);
				}
			});
		}
	},function(error) { 
		setMessage("Error: "+error, true); 
		console.log(error);
	});
}


function setMessage(message, log){
	$("#message").fadeIn().append('<p><small>'+$.datepicker.formatDate( "dd-mm-yy ", new Date() ) + new Date().getHours() +":"+ new Date().getMinutes()+'>> '+message+'</small></p>');
	/*setTimeout(function() {
  		$("#message").fadeOut().empty();
	}, 5000);*/
	if(log == true)
		$SP().list("Logs").add({Title: message});
}

function rmUserFromGroup(login,groupName){
	return $SP().webService({ 
		service:"UserGroup",
		operation:"RemoveUserFromGroup",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
	  	properties:{
		    groupName: groupName,
		    userLoginName: login
	  	}
	}).then(function(response) {
	  	setMessage("Usunięto "+login+" z "+groupName, true);
	}, 
	function(error) { 
		setMessage("Error: "+error, true);
		console.log(error);
	});
}

function getAllGroups(groupName){
	return $SP().webService({ 
	service:"UserGroup",
	operation:"GetGroupCollectionFromSite",
	soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/"
	}).then(function(response) {
		var trGroup = '';
		$(response).find("Group").each(function(){
			if(typeof groupName == 'undefined'|| $(this).attr("Name").search(groupName) > -1){
				trGroup +="<tr id="+$(this).attr("ID")+">"+
				"<td><input type='checkbox' id='trch2' groupName='"+$(this).attr("Name")+"'></td>"+
				"<td><a href='/_layouts/editgrp.aspx?Group="+$(this).attr("Name")+"' target='_blank'>" + $(this).attr("ID") + "</a></td>"+
				"<td><a href='/_layouts/people.aspx?MembershipGroupId="+$(this).attr("ID")+"' target='_blank'>" + $(this).attr("Name") + "</a></td>"+
				"<td><small>"+$(this).attr("Description")+"</small></td>"+
				'<td><button class="btn btn-danger btn-xs" onclick="rmGroup(\''+$(this).attr("Name")+'\');$(this).parent().parent().remove();return false;"><small>x</small></button></td>'+
				"</tr>";
			}
		});
		$("#tbGroups").append(trGroup);
	}, 
	function(error) { 
		setMessage("Error: "+error, true); 
		console.log(error);
	});
}

function rmGroup(groupName){
	if(confirm("Czy napewno chcesz usunąć grupę:"+ groupName +"?")){
		$("#wait").show();
		$SP().webService({ 
			service:"UserGroup",
			operation:"RemoveGroup",
			soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
			properties:{
			    groupName: groupName
			}
		}).then(function(response) {
		  	setMessage("Usunięto grupę: "+groupName, true);
		  	$("#wait").hide();
		}, 
		function(error) { 
			setMessage("Error: "+error, true); 
			console.log(error);
			$("#wait").hide();
		});
	}
}

function selectedUsersCollection(){
	var xml = '<Users>';
	$('input[id^=trch1]:checked').each(function(index, el) {
		xml+='<User LoginName="'+$(el).attr("login")+'" '+ 
      	'Email="'+$(el).attr("email")+'" '+
      	'Name="'+$(el).attr("name")+'" '+
      	'Notes="" />'
	});
	xml+='</Users>';
	return(xml);
}

function addUsersCollectionToGroup(groupName, usersXML){
	return $SP().webService({ 
		service:"UserGroup",
		operation:"AddUserCollectionToGroup",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
		properties:{
			groupName: groupName,
			usersInfoXml: usersXML
			}
	}).then(function(response) {
		$(usersXML).find("User").each(function(index2, el2) {
			setMessage("Usera: "+$(el2).attr('LoginName')+" dodano do grupy: "+groupName, true);
		});
	},function(error) { 
		setMessage("Error: "+error, true); 
		console.log(error);
	});
}