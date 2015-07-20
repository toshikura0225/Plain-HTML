var socket;
﻿$(function () {


	socket = io.connect();
	
	$("button").click(function () {
		// {"name":"John"}
	  //alert($(this).attr("id"));
	  socket.emit('msg', "{'button':'" + $(this).attr("id") + "'}");
	});
	
	
	

});