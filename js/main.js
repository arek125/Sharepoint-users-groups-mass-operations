$(document).ready(function() {
	//$("#includedContent").load("/_layouts/usergroup/userGroup.html",main);
	$("#url").html("<a href='"+window.location.origin+"'>"+window.location.hostname+"</a>");
	$("#userSearch").on('click', function(event) {
		event.preventDefault();
		$("#tbUsers").empty();
		$.each($('textarea[psname$=user]').val().split(/\n/), function (i, line) {
			if (line)usersSearch(line);
				//$SP().addressbook(line, {limit:100}, function(people) {
					/*
					if (people.length == 0)setMessage("Nie znaleziono: "+line, false);
					var peopleInGroups = $.grep(people,function(el,i){
						return ( el.UserInfoID != -1);
					});
					var trUser = "";
					for (var i=0; i < peopleInGroups.length; i++) {
						//console.log(people[i].AccountName+ "-"+ people[i].DisplayName);
						trUser+="<tr id="+peopleInGroups[i].UserInfoID+">"+
						"<td><input type='checkbox' id='trch' login='"+peopleInGroups[i].AccountName+"' name='"+peopleInGroups[i].DisplayName+"' email='"+peopleInGroups[i].Email+"'></td>"+
						"<td>"+peopleInGroups[i].UserInfoID+"</td>"+
						"<td><a href='/_layouts/userdisp.aspx?ID="+peopleInGroups[i].UserInfoID+"' target='_blank'>" + peopleInGroups[i].DisplayName + "</a></td>"+
						"<td>"+peopleInGroups[i].AccountName+"</td>"+
						"<td></td>"+
						"</tr>";
				  	}
				  	if($("#caleAd").is(":checked")){
				  		var peopleNotInGroups = $.grep(people,function(el,i){
							return ( el.UserInfoID == -1);
						});
						for (var i=0; i < peopleNotInGroups.length; i++) {
						trUser+="<tr id="+peopleNotInGroups[i].UserInfoID+">"+
						"<td><input type='checkbox' id='trch' login='"+peopleNotInGroups[i].AccountName+"'></td>"+
						"<td>"+peopleNotInGroups[i].UserInfoID+"</td>"+
						"<td>" + peopleNotInGroups[i].DisplayName + "</td>"+
						"<td>"+peopleNotInGroups[i].AccountName+"</td>"+
						"<td></td>"+
						"</tr>";
						}
				  	}
				  	$("#tbUsers").append(trUser);
					for (var i=0; i < peopleInGroups.length; i++) {
						getGroups(peopleInGroups[i].AccountName, peopleInGroups[i].UserInfoID);
					}
					*/
				//});
		});
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

    $("#alltrch").on('click', function(){
        $('input[id^=trch]').prop('checked', $(this).is(':checked'));
    });
    $("#alltrch2").on('click', function(){
        $('input[id^=trch2]').prop('checked', $(this).is(':checked'));
    });
});

function usersSearch(line){
	$("#wait").show();
	$SP().webService({ 
		service:"People",
	  	operation:"SearchPrincipals",
	  	soapURL:"http://schemas.microsoft.com/sharepoint/soap/",
	  	properties:{
    		searchText: line,
			maxResults: 100,
			principalType: "User"
  		}
	}).then(function(response) {
  	//console.log(response);
  	var people = [];
  	$(response).find("PrincipalInfo").each(function(index, el) {
  		people.push({
  			AccountName: $(el).find("AccountName").text(),
  			UserInfoID: $(el).find("UserInfoID").text(),
  			DisplayName: $(el).find("DisplayName").text(),
  			Email: $(el).find("Email").text(),
  			Department: $(el).find("Department").text(),
  			Title: $(el).find("Title").text()
  		})
  	});
	if (people.length == 0)setMessage("Nie znaleziono: "+line, false);
	var peopleInGroups = $.grep(people,function(el,i){
		return ( el.UserInfoID != -1);
	});
	var trUser = "";
	for (var i=0; i < peopleInGroups.length; i++) {
		trUser+="<tr id="+peopleInGroups[i].UserInfoID+">"+
		"<td><input type='checkbox' id='trch' login='"+peopleInGroups[i].AccountName+"' name='"+peopleInGroups[i].DisplayName+"' email='"+peopleInGroups[i].Email+"'></td>"+
		"<td>"+peopleInGroups[i].UserInfoID+"</td>"+
		"<td><a href='/_layouts/userdisp.aspx?ID="+peopleInGroups[i].UserInfoID+"' target='_blank'>" + peopleInGroups[i].DisplayName + "</a></td>"+
		"<td>"+peopleInGroups[i].AccountName+"</td>"+
		"<td></td>"+
		"</tr>";
  	}
  	if($("#caleAd").is(":checked")){
  		var peopleNotInGroups = $.grep(people,function(el,i){
			return ( el.UserInfoID == -1);
		});
		for (var i=0; i < peopleNotInGroups.length; i++) {
		trUser+="<tr id="+peopleNotInGroups[i].UserInfoID+">"+
		"<td><input type='checkbox' id='trch' login='"+peopleNotInGroups[i].AccountName+"'></td>"+
		"<td>"+peopleNotInGroups[i].UserInfoID+"</td>"+
		"<td>" + peopleNotInGroups[i].DisplayName + "</td>"+
		"<td>"+peopleNotInGroups[i].AccountName+"</td>"+
		"<td></td>"+
		"</tr>";
		}
  	}
  	$("#tbUsers").append(trUser);
	for (var i=0; i < peopleInGroups.length; i++) {
		getGroups(peopleInGroups[i].AccountName, peopleInGroups[i].UserInfoID);
	}
	$("#wait").hide();
	},function(error) { 
		setMessage("Error: "+error, true); 
		$("#wait").hide();
	}); 
}

function getGroups(login,userId){
	$("#wait").show();
 	$SP().webService({
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
			sgroupsLi += '<li class="list-group-item"><small>'+cGroupName+'</small><button class="btn btn-danger btn-xs" onclick="rmUserFromGroup(\''+onlyDomain+'\\\\'+onlyLogin+'\',\''+cGroupName+'\');$(this).parent().remove();return false;"><small>x</small></button></li>';
			userGroups.push(cGroupName);
			i++;
		});
		if (i>0)sgroupsLi +='<li class="list-group-item"><button class="btn btn-danger btn-xs" id="dlg'+userId+'"><small>Usuń z tych grup</small></button></li>';
		sgroups.html(sgroupsLi);
		$("#"+userId+" td:last").append(sgroups);
		if (i>0){
			$("#dlg"+userId).on('click', function(event) {
				event.preventDefault();
				if(confirm("Czy napewno chcesz usunąć usera "+login+" z wszystkich grup ?")){
					for (var j=0; j < userGroups.length; j++) {
						rmUserFromGroup(login,userGroups[j]);
					}
					$("#g"+userId).remove();
				}
			});
		}
		$("#wait").hide();
	},function(error) { 
		setMessage("Error: "+error, true); 
		$("#wait").hide();
	});
}


function setMessage(message, log){
	$("#message").fadeIn().append('<p><strong>'+message+'</strong></p>')
	setTimeout(function() {
  		$("#message").fadeOut().empty();
	}, 10000);
	if(log == true)
		$SP().list("Tools","/admin").add({Title: message});
}

function rmUserFromGroup(login,groupName){
	$("#wait").show();
	$SP().webService({ 
		service:"UserGroup",
		operation:"RemoveUserFromGroup",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
	  	properties:{
		    groupName: groupName,
		    userLoginName: login
	  	}
	}).then(function(response) {
	  	setMessage("Usunięto "+login+" z "+groupName, true);
	  	$("#wait").hide();
	}, 
	function(error) { 
		setMessage("Error: "+error, true); 
		$("#wait").hide();
	});
}

function getAllGroups(groupName){
	$("#wait").show();
	$SP().webService({ 
	service:"UserGroup",
	operation:"GetGroupCollectionFromSite",
	soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/"
	}).then(function(response) {
		var trGroup = '';
		$("#tbGroups").empty();
		$(response).find("Group").each(function(){
			if(typeof groupName == 'undefined'|| $(this).attr("Name").search(groupName) > -1)
				trGroup +="<tr id="+$(this).attr("ID")+">"+
				"<td><input type='checkbox' id='trch2' groupName='"+$(this).attr("Name")+"'></td>"+
				"<td><a href='/_layouts/editgrp.aspx?Group="+$(this).attr("Name")+"' target='_blank'>" + $(this).attr("ID") + "</a></td>"+
				"<td><a href='/_layouts/people.aspx?MembershipGroupId="+$(this).attr("ID")+"' target='_blank'>" + $(this).attr("Name") + "</a></td>"+
				"<td><small>"+$(this).attr("Description")+"</small></td>"+
				'<td><button class="btn btn-danger btn-xs" onclick="rmGroup(\''+$(this).attr("Name")+'\');$(this).parent().parent().remove();return false;"><small>x</small></button></td>'+
				"</tr>";
		});
		$("#tbGroups").append(trGroup);
		$("#wait").hide();
	}, 
	function(error) { 
		setMessage("Error: "+error, true); 
		$("#wait").hide();
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
			$("#wait").hide();
		});
	}
}

function selectedUsersCollection(){
	var xml = '<Users>';
	$('input[id^=trch]:checked').each(function(index, el) {
		xml+='<User LoginName="'+$(el).attr("login")+'"'+ 
      	'Email="'+$(el).attr("email")+'"'+
      	'Name="'+$(el).attr("name")+'"'+
      	'Notes=""/>'
	});
	xml+='</Users>';
	return(xml);
}