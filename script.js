// JavaScript code for client-side functionality

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const callCodeInput = document.getElementById('call-code-input');
const joinButton = document.getElementById('join-btn');

let localStream;
let remoteStream;
let peerConnection;
let callCode;
const socket = new WebSocket('ws://localhost:3000');

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
    }).catch(error => console.error('Error accessing media devices.', error));

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    switch (data.type) {
        case 'offer':
            handleOffer(data.offer);
            break;
        case 'answer':
            handleAnswer(data.answer);
            break;
        case 'candidate':
            handleCandidate(data.candidate);
            break;
        case 'message':
            displayMessage(data.user, data.message);
            break;
        case 'callCode':
            handleCallCode(data.callCode);
            break;
        default:
            break;
    }
};

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        const data = { type: 'message', user: 'Me', message };
        socket.send(JSON.stringify(data));
        displayMessage('Me', message);
        messageInput.value = '';
    }
}

function displayMessage(user, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = `${user}: ${message}`;
    messageElement.appendChild(messageContent);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
}

function handleOffer(offer) {
    createPeerConnection();
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer()
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'answer', answer }));
        }).catch(error => console.error('Error creating answer.', error));
}

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function handleCallCode(code) {
    callCode = code;
    callCodeInput.value = code;
}

joinButton.addEventListener('click', () => {
    const code = callCodeInput.value.trim();
    if (code) {
        // Implement logic to join a call using the provided code
        // For simplicity, let's assume the code is valid and we directly join the call
        joinCall(code);
    }
});

function joinCall(code) {
    // You can implement the logic to join the call with the provided code here
    // For example, you might send a request to the server to join the call with the specified code
}

document.getElementById('mute-btn').addEventListener('click', () => {
    // Implement functionality to mute/unmute the audio
    // For simplicity, let's assume toggling mute/unmute directly on the local audio track
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(track => {
        track.enabled = !track.enabled;
    });
    // Update the UI accordingly (e.g., change button text/icon)
    const button = document.getElementById('mute-btn');
    button.textContent = audioTracks[0].enabled ? 'Mute' : 'Unmute';
});

document.getElementById('end-call-btn').addEventListener('click', () => {
    // Implement functionality to end the call
    // Terminate the peer connection, close the video streams, and notify the server
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    remoteVideo.srcObject = null;
    // You can notify the server that the call has ended
    socket.send(JSON.stringify({ type: 'end-call' }));
});

document.getElementById('regenerate-code-btn').addEventListener('click', () => {
    // Implement functionality to regenerate the call code
    // For simplicity, let's assume the server generates and sends a new code
    socket.send(JSON.stringify({ type: 'regenerate-code' }));
});