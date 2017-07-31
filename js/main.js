var interVal = 100;//ms
var saveLogs = true;
var groupCreationSetting={
	ownerIdentifier: 'Site Owners', //Group name or DOMAIN\\login
	ownerType: "group", //user or group
	defaultUserLoginName: "DOMAIN\\login", //DOMAIN\\login
	discritpion: "", //optional
	roles: ["Contribute","Read"] //roles names
}
var utSett={
	"order": [],
	"columnDefs": [ {
		"targets": 'no-sort',
		"orderable": false,
	} ]
};
var gtSett={
	"order": [],
	"pageLength": 25,
	"columnDefs": [ {
		"targets": 'no-sort',
		"orderable": false,
	} ]
};
$(document).ready(function() {
	$("#content").DataTable(utSett);
	$("#url").html("<a href='"+window.location.origin+"'>"+window.location.hostname+"</a>");
	$("#userSearch").on('click', function(event) {
		event.preventDefault();
		$("#content").DataTable().destroy();
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
				$("#content").DataTable(utSett);
				$('input[id="trch1"]').change(function() {
					var tr = $(this).parent().parent();
					if($(this).prop('checked'))tr.css('background-color', '#eee');
					else tr.css('background-color', '#fff');
				}); 
				$("#wait").hide();
			},function(error) {
				$("#wait").hide();
			});
		}, op);	
	});
	$("#groupSearch").on('click', function(event) {
		event.preventDefault();
		$("#content2").DataTable().destroy();
		$("#tbGroups").empty();
		var allSearchAjax = [], op = 0;
		$("#wait").show();
		if(!$('textarea[psname$=group]').val())allSearchAjax.push(getAllGroups());
		$.each($('textarea[psname$=group]').val().split(/\n/), function (i, line) {
			if (line){
				setTimeout(function(){
					allSearchAjax.push(searchGroups(line));
				}, op);
				op+=interVal;
			}
		});
		setTimeout(function(){
			$.when.apply($, allSearchAjax).then(function() {
				$("#content2").DataTable(gtSett);
				$('input[id="trch2"]').change(function() {
					var tr = $(this).parent().parent();
					if($(this).prop('checked'))tr.css('background-color', '#eee');
					else tr.css('background-color', '#fff');
				}); 
				$("#wait").hide();
			},function(error) {
				$("#wait").hide();
			});
		}, op);
	});

	$("#createGroups").on('click', function(event) {
		event.preventDefault();
		if(confirm("Create new groups ?: \n"+ $('textarea[psname$=group]').val())){
			var allSearchAjax = [], op = 0;
			$("#wait").show();
			$.each($('textarea[psname$=group]').val().split(/\n/), function (i, line) {
				if (line){
					setTimeout(function(){
						allSearchAjax.push(createGroup(line));
					}, op);
					op+=interVal;
				}
			});
			setTimeout(function(){
				$.when.apply($, allSearchAjax).then(function() {
					$("#groupSearch").trigger("click");
				},function(error) {
					$("#wait").hide();
				});
			}, op);
		}
	});

	$("#removeGroups").on('click', function(event) {
		event.preventDefault();
		if(confirm("Remove selected groups ?")){
			var allSearchAjax = [], op = 0;
			$("#wait").show();
			$('input[id^=trch2]:checked').each(function(index, el) {
				setTimeout(function(){
					allSearchAjax.push(rmGroup($(el).attr("groupname"),true));
				}, op);
				op+=interVal;
			});
			setTimeout(function(){
				$.when.apply($, allSearchAjax).then(function() {
					$("#groupSearch").trigger("click");
				},function(error) {
					$("#wait").hide();
				});
			}, op);
		}
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
			op+=interVal*3;
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
		$('input[id^=trch1]').trigger('change');
    });
    $("#alltrch2").on('click', function(){
		$('input[id^=trch2]').prop('checked', $(this).is(':checked'));
		$('input[id^=trch2]').trigger('change');
	});

	$("#wait").show();
	if(saveLogs)
		$SP().webService({ 
			service:"Lists",
			operation:"GetListCollection",
			soapURL:"http://schemas.microsoft.com/sharepoint/soap/"
		}).then(function(response) {
			var logListExist = false;
			$(response).find("List").each(function(){
				var listName =$(this).attr("Title");
				if (listName == "SUGMO Logs")logListExist = true;
			});
			if(!logListExist)
				$SP().webService({ 
					service:"Lists",
					operation:"AddList",
					soapURL:"http://schemas.microsoft.com/sharepoint/soap/",
					properties:{
						listName: "SUGMO Logs",
						description: "List for SUGMO operations loging.",
						templateID: 100
					}
				}).then(function(response) {
					setMessage("Log list created.", saveLogs);
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
	new Clipboard('#copyLogins', {
	    text: function(trigger) {
	        return selectedUsersLogins();
	    }
	});
	$("#groupSearch").trigger("click");
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
		if (people.length == 0)setMessage("Nie znaleziono: "+line, saveLogs);
		var peopleInGroups = $.grep(people,function(el,i){
			return ( el.UserInfoID != -1);
		});
		var trUser = "";
		for (var i=0; i < peopleInGroups.length; i++) {
			trUser+="<tr id="+peopleInGroups[i].UserInfoID+">"+
			"<td><input type='checkbox' id='trch1' login='"+peopleInGroups[i].AccountName+"' login2='"+peopleInGroups[i].AccountName2+"' name='"+peopleInGroups[i].DisplayName+"' email='"+peopleInGroups[i].Email+"'></td>"+
			"<td><table class='small-table' id='ulp"+peopleInGroups[i].UserInfoID+"'>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small>"+peopleInGroups[i].UserInfoID+"</small></td></tr>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small><a href='/_layouts/userdisp.aspx?ID="+peopleInGroups[i].UserInfoID+"' target='_blank'>" + peopleInGroups[i].DisplayName + "</a></small></td></tr>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small>"+peopleInGroups[i].AccountName+"</small></td></tr>"+
			"<tr><td><small>"+peopleInGroups[i].Email+"</small></td></tr>"+
			"</table></td>"+
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
			"<td><table class='small-table' id='ulp"+peopleNotInGroups[i].UserInfoID+"'>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small>"+peopleNotInGroups[i].UserInfoID+"</small></td></tr>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small>"+peopleNotInGroups[i].DisplayName+"</small></td></tr>"+
			"<tr style='border-bottom: 1pt solid #ccc;'><td><small>"+peopleNotInGroups[i].AccountName+"</small></td></tr>"+
			"<tr><td><small>"+peopleNotInGroups[i].Email+"</small></td></tr>"+
			"</table></td>"+
			"<td></td>"+
			"</tr>";
			}
	  	}
	  	$("#tbUsers").append(trUser);
		for (var i=0; i < peopleInGroups.length; i++) {
			getGroups(peopleInGroups[i].AccountName, peopleInGroups[i].UserInfoID);
		}
	},function(error) { 
		setMessage("Error: "+error, saveLogs);
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
		var sgroups = $('<table class="small-table" id="g'+userId+'">');
		var sgroupsLi = ''; var userGroups=[];
		var i = 0;
		var splitedLogin = login.split("\\");
		var onlyDomain = splitedLogin[0];
		var onlyLogin = splitedLogin[1];
		$(response).find("Group").each(function(){
			var cGroupName = $(this).attr("Name");
			sgroupsLi += '<tr style="border-bottom: 1pt solid #ccc;"><td><small>'+cGroupName+'</small></td>'+
			'<td><div class="btn-group pull-right"><button data-toggle="tooltip" title="Remove this user from this group" class="btn btn-danger btn-xs" onclick="rmUserFromGroup(\''+onlyDomain+'\\\\'+onlyLogin+'\',\''+cGroupName+'\');$(this).parent().remove();return false;"><small>x</small></button>'+
			'<button data-toggle="tooltip" title="Add selected users to this group" class="btn btn-success btn-xs" onclick="event.preventDefault();addUsersCollectionToGroup(\''+cGroupName+'\',selectedUsersCollection()).then(function(response) {$(\'#userSearch\').trigger(\'click\');});return false;"><small>></small></button></div></td></tr>';
			userGroups.push(cGroupName);
			i++;
		});
		if (i>0){
			sgroupsLi +='<tr><td colspan="2"><div class="btn-group pull-right"><button data-toggle="tooltip" title="Remove from this all groups" class="btn btn-danger btn-xs" id="dlg'+userId+'"><small>xxx</small></button>'+
			'<button data-toggle="tooltip" title="Add selected to this groups" class="btn btn-success btn-xs" id="addg'+userId+'"><small>>>></small></button></div></td></tr></table>';
		
			sgroups.html(sgroupsLi);
			$("#"+userId+" td:last").html(sgroups);
			if (i>0){
				$("#dlg"+userId).on('click', function(event) {
					event.preventDefault();
					if(confirm("Are you sure you want to delete the user "+ login +" from all groups ?")){
						var allSearchAjax = [],j=0;
						$("#wait").show();
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
					if(confirm("Are you sure you want to add selected users to all of this user "+login+" groups ?")){
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
						},interVal*3);
					}
				});
			}
		}
	},function(error) { 
		setMessage("Error: "+error, saveLogs); 
		console.log(error);
	});
}


function setMessage(message, log){
	$("#message").fadeIn().append('<p><small>'+$.datepicker.formatDate( "dd-mm-yy ", new Date() ) + new Date().getHours() +":"+ new Date().getMinutes()+'>> '+message+'</small></p>');
	/*setTimeout(function() {
  		$("#message").fadeOut().empty();
	}, 5000);*/
	if(log == true)
		$SP().list("SUGMO Logs").add({Title: message});
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
	  	setMessage(login+" deleted from "+groupName, saveLogs);
	}, 
	function(error) { 
		setMessage("Error: "+error, saveLogs);
		console.log(error);
	});
}

function getAllGroups(){
	return $SP().webService({ 
	service:"UserGroup",
	operation:"GetGroupCollectionFromSite",
	soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/"
	}).then(function(response) {
		var trGroup = '';
		$(response).find("Group").each(function(){
			trGroup +="<tr id="+$(this).attr("ID")+">"+
			"<td><input type='checkbox' id='trch2' groupName='"+$(this).attr("Name")+"'></td>"+
			"<td><a href='/_layouts/editgrp.aspx?Group="+$(this).attr("Name")+"' target='_blank'>" + $(this).attr("ID") + "</a></td>"+
			"<td><a href='/_layouts/people.aspx?MembershipGroupId="+$(this).attr("ID")+"' target='_blank'>" + $(this).attr("Name") + "</a></td>"+
			"<td><small>"+$(this).attr("Description")+"</small></td>"+
			'<td><div class="btn-group" style="width:35px"><button data-toggle="tooltip" title="Remove this group" class="btn btn-danger btn-xs" onclick="rmGroup(\''+$(this).attr("Name")+'\');return false;"><small>x</small></button>'+
			'<button data-toggle="tooltip" title="Add selected users to this group" class="btn btn-success btn-xs" onclick="addUsersCollectionToGroup(\''+$(this).attr("Name")+'\', selectedUsersCollection()).then(function(response) {$(\'#userSearch\').trigger(\'click\');});return false;"><small>></small></button></div></td>'+
			"</tr>";
		});
		$("#tbGroups").append(trGroup);
	}, 
	function(error) { 
		setMessage("Error: "+error, saveLogs); 
		console.log(error);
	});
}

function searchGroups(groupName){
	return $SP().webService({ 
		service:"People",
	  	operation:"SearchPrincipals",
	  	soapURL:"http://schemas.microsoft.com/sharepoint/soap/",
	  	properties:{
    		searchText: groupName,
			maxResults: 200,
			principalType: "SharePointGroup"
  		}
	}).then(function(response){
		var trGroup = '';
		$(response).find("PrincipalInfo").each(function(index, el){
			trGroup +="<tr id="+$(el).find("UserInfoID").text()+">"+
			"<td><input type='checkbox' id='trch2' groupName='"+$(el).find("AccountName").text()+"'></td>"+
			"<td><a href='/_layouts/editgrp.aspx?Group="+$(el).find("AccountName").text()+"' target='_blank'>" + $(el).find("UserInfoID").text() + "</a></td>"+
			"<td><a href='/_layouts/people.aspx?MembershipGroupId="+$(el).find("UserInfoID").text()+"' target='_blank'>" + $(el).find("AccountName").text() + "</a></td>"+
			"<td><small></small></td>"+
			'<td><div class="btn-group" style="width:35px"><button data-toggle="tooltip" title="Remove this group" class="btn btn-danger btn-xs" onclick="rmGroup(\''+$(el).find("AccountName").text()+'\');return false;"><small>x</small></button>'+
			'<button data-toggle="tooltip" title="Add selected users to this group" class="btn btn-success btn-xs" onclick="addUsersCollectionToGroup(\''+$(el).find("AccountName").text()+'\', selectedUsersCollection()).then(function(response) {$(\'#userSearch\').trigger(\'click\');});return false;"><small>></small></button></div></td>'+
			"</tr>";
		});
		$("#tbGroups").append(trGroup);
	});
}

function rmGroup(groupName, notConfirm){
	function removeGroup(){
		$("#wait").show();
		return $SP().webService({ 
			service:"UserGroup",
			operation:"RemoveGroup",
			soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
			properties:{
			    groupName: groupName
			}
		}).then(function(response) {
		  	setMessage(groupName+" group deleted", saveLogs);
		  	$("#wait").hide();
		}, 
		function(error) { 
			setMessage("Error: "+error, saveLogs); 
			console.log(error);
			$("#wait").hide();
		});
	}
	if (notConfirm)return removeGroup();
	else if(confirm("Are you sure you want to delete group: "+ groupName +" ?"))removeGroup().then(function(res){
		$("#groupSearch").trigger("click");
	});
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
			setMessage($(el2).attr('LoginName')+" added to group: "+groupName, saveLogs);
		});
	},function(error) { 
		setMessage("Error: "+error, saveLogs); 
		console.log(error);
	});
}

function selectedUsersLogins(){
	var total = $('input[id^=trch1]:checked').length;
	var loginsString = '';
	$('input[id^=trch1]:checked').each(function(index, el) {
		if (index === total - 1) 
			loginsString+=$(el).attr("login");
    	else
			loginsString+=$(el).attr("login")+';';
	});
	return loginsString;
}

function createGroup(groupName){
	return $SP().webService({ 
		service:"UserGroup",
		operation:"AddGroup",
		soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
		properties:{
			groupName: groupName,
            ownerIdentifier: groupCreationSetting.ownerIdentifier,
            ownerType: groupCreationSetting.ownerType,
            defaultUserLoginName: groupCreationSetting.defaultUserLoginName,
            discrytpion: groupCreationSetting.discritpion
		}
	}).then(function(response) {
		rmUserFromGroup(groupCreationSetting.defaultUserLoginName, groupName);
		for(var role in groupCreationSetting.roles)
			$SP().webService({ 
				service:"UserGroup",
				operation:"AddGroupToRole",
				soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
				properties:{
					groupName: groupName,
					roleName: groupCreationSetting.roles[role]
				}
			}).then(function(response) {
				//...
			},function(error) { 
				setMessage("Error: "+error, saveLogs); 
				console.log(error);
			});
		setMessage("Group "+groupName+" created", saveLogs); 
	},function(error) { 
		setMessage("Error: "+error, saveLogs); 
		console.log(error);
	});
}

