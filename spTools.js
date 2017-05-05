$(document).ready(function() {
	$("#userSearch").on('click', function(event) {
		event.preventDefault();
		var trUser = "";
		var table = $('<table border="1">');
		var thead = $("<thead><th>LP</th><th>ID</th><th>NAZWA</th><th>LOGIN</th><th>GRUPY</th></thead>");
		var tbody = $("<tbody>");
		$SP().addressbook($("input[psname$=user]").val(), {limit:100}, function(people) {
			var peopleInGroups = $.grep(people,function(el,i){
				return ( el.UserInfoID != -1);
			});
			for (var i=0; i < peopleInGroups.length; i++) {
				//console.log(people[i].AccountName+ "-"+ people[i].DisplayName);
				trUser+="<tr id="+peopleInGroups[i].UserInfoID+">"+
				"<td>"+(i+1)+"</td><td>"+peopleInGroups[i].UserInfoID+"</td>"+
				"<td><a href='/_layouts/userdisp.aspx?ID="+peopleInGroups[i].UserInfoID+"'>" + peopleInGroups[i].DisplayName + "</a></td>"+
				"<td>"+peopleInGroups[i].AccountName+"</td>"+
				"<td></td>"+
				"</tr>";
		  	}
			tbody.html(trUser);
			table.append(thead);
			table.append(tbody);
			$("#content").empty();
			$("#content").append(table);
			for (var i=0; i < peopleInGroups.length; i++) {
				getGroups(peopleInGroups[i].AccountName, peopleInGroups[i].UserInfoID);
			}
		});
	});

	function getGroups(login,userId){
		 	$SP().webService({
			service:"UserGroup",
			operation:"GetGroupCollectionFromUser",
			soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
			properties:{
				userLoginName: login
			}
		}).then(function(response) {
			var sgroups = $('<ul id="g'+userId+'">');
			var sgroupsLi = ''; var userGroups=[];
			var i = 0;
			$(response).find("Group").each(function(){
				sgroupsLi += "<li>"+$(this).attr("Name")+"</li>";
				userGroups.push($(this).attr("Name"));
				i++;
			});
			if (i>0)sgroupsLi +='<li><button id="dlg'+userId+'"><small>Usuń z tych grup</small></button></li>';
			sgroups.html(sgroupsLi);
			$("#"+userId+" td:last").append(sgroups);
			if (i>0)
				$("#dlg"+userId).on('click', function(event) {
					event.preventDefault();
					if(confirm("Czy napewno chcesz usunąć usera z tych grup ?"))
						for (var j=0; j < userGroups.length; j++) {
							$SP().webService({ 
							  service:"UserGroup",
							  operation:"RemoveUserFromGroup",
							  soapURL:"http://schemas.microsoft.com/sharepoint/soap/directory/",
							  properties:{
							    groupName: userGroups[j],
							    userLoginName: login
							  }
							}).then(function(response) {
							  	setMessage("Usunięto "+login+" z "+userGroups[j]);
							  	$("#g"+userId).remove();
							}, 
							function(error) { 
								setMessage("Error: "+error); 
							});
						};
				});
		});
	}

	function setMessage(message){
		$("#message").fadeIn().append('<p><strong>'+message+'</strong></p>')
		setTimeout(function() {
	  		$("#message").fadeOut().empty();
		}, 2000);
	}

});

