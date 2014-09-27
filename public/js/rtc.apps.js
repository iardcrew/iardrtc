$(function() {
	var localStream, pc, 
		servers = null,
		invited = false,
		localVideo = document.getElementById("local-video"),
		remoteVideo = document.getElementById("remote-video"),
		socket = io.connect();

	$('#call-button').click(start);
	$('#hangup-button').click(function() {
		socket.emit('message', {type: 'BYE'});
		hangup();
	});

	socket.on('connect', function() {
		$('#message-box').html('Connected');
	});

	socket.on('message', function(data) {
		console.log(data);
		switch (data.type) {
			case 'INVITE':
				invited = true;
				$('#message-box').html('Ringing');
				$('#call-button').html('Answer');
				break;
			case 'OK':
				calling();
				break;
			case 'SDP Offer':
				called(data.desc);
				break;
			case 'SDP Answer':
				pc.setRemoteDescription(new RTCSessionDescription(data.desc));
				break;
			case 'ICE':
				pc.addIceCandidate(new RTCIceCandidate(data.candidate));
				break;
			case 'BYE':
				hangup();
				break;
		}
	});

	function start() {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		navigator.getUserMedia({audio:true, video: { mandatory: { minWidth: 1280, minHeight: 720}}}, gotStream, function(error) {
			console.log("navigator.getUserMedia error: ");
			console.log(error);
		});
	}

	function gotStream(stream) {
		localStream = stream;

		pc = new webkitRTCPeerConnection(servers);	

		if (invited) {
			socket.emit('message', {type: 'OK'});
		} else {
			$('#message-box').html('Ringing');
			$('#call-button').attr('disabled','disabled');
			socket.emit('message', {type: 'INVITE'});
		}
	}

	function calling() { // after get ok
		setPeerConnetionSetup();

		pc.createOffer(gotOfferDescription);
	}

	function called(description) { // call after sdp offer
		setPeerConnetionSetup();

		pc.setRemoteDescription(new RTCSessionDescription(description));
		pc.createAnswer(gotAnswerDescription);
	}

	function gotOfferDescription(description) {
		console.log('gotOfferDescription :');
		console.log(description);
		pc.setLocalDescription(description);
		socket.emit('message', {type: 'SDP Offer', desc: description});
	}

	function gotAnswerDescription(description) {
		console.log('gotAnswerDescription :');
		console.log(description);
		pc.setLocalDescription(description);
		socket.emit('message', {type: 'SDP Answer', desc: description});
	}

	function gotIceCandidate(event) {
		if (event.candidate) {
			console.log('gotIceCandidate :');
			console.log(event.candidate);
			socket.emit('message', {type: 'ICE', candidate: event.candidate});
		}
	}

	function setPeerConnetionSetup() {
		localVideo.src = URL.createObjectURL(localStream);

		pc.onicecandidate = gotIceCandidate;
		pc.onaddstream = gotRemoteStream;
		pc.addStream(localStream);

		$('#call-container').css('display', 'none');
		$('#video-container').css('display', 'block');
	}

	function gotRemoteStream(event) {
		remoteVideo.src = URL.createObjectURL(event.stream);
	}

	function hangup() {
		pc.close();
		localStream.stop();
		pc = null;
		invited = false;
		$('#message-box').html('Connected');
		$('#call-button').html('Call someone');
		$('#call-button').removeAttr('disabled');
		$('#call-container').css('display', 'block');
		$('#video-container').css('display', 'none');
	}

});