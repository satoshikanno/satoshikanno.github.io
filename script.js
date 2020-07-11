const Peer = window.Peer;

(async function main() {
    const localVideo = document.getElementById('js-local-video');
    const localId = document.getElementById('js-local-id');
    const remoteVideo = document.getElementById('js-remote-video');
    const remoteId = document.getElementById('js-remote-id');
    const connectedId = document.getElementById('js-connected-id');
    const callTrigger = document.getElementById('js-call-trigger');
    const closeTrigger = document.getElementById('js-close-trigger');

    const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    });
    localVideo.srcObject = localStream;

    let audioSelect = $('#audioSource');
    let videoSelect = $('#videoSource');

    navigator.mediaDevices.enumerateDevices()
        .then(function(deviceInfos) {
            for (let i = 0; i !== deviceInfos.length; ++i) {
                let deviceInfo = deviceInfos[i];
                let option = $('<option>');
                option.val(deviceInfo.deviceId);
                if (deviceInfo.kind === 'audioinput') {
                    option.text(deviceInfo.label);
                    audioSelect.append(option);
                } else if (deviceInfo.kind === 'videoinput') {
                    option.text(deviceInfo.label);
                    videoSelect.append(option);
                }
            }
            videoSelect.on('change', setupGetUserMedia);
            audioSelect.on('change', setupGetUserMedia);
            setupGetUserMedia();
        }).catch(function (error) {
            console.error('mediaDevices.enumerateDevices() error:', error);
            return;
        });

    function setupGetUserMedia() {
        let audioSource = $('#audioSource').val();
        let videoSource = $('#videoSource').val();
        let constraints = {
            audio: {deviceId: {exact: audioSource}},
            video: {deviceId: {exact: videoSource}}
        };

        // 省略

        if(localStream){
            localStream = null;
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                $('#myStream').get(0).srcObject = stream;
                localStream = stream;

                if(existingCall){
                    existingCall.replaceStream(stream);
                }

            }).catch(function (error) {
                console.error('mediaDevice.getUserMedia() error:', error);
                return;
            });
    }

    const peer = new Peer({
        key: window.__SKYWAY_KEY__,
        debug: 3,
    });

    peer.on('open', (id) => {
        localId.textContent = id;
    });

    peer.on('call', mediaConnection => {
        mediaConnection.answer(localStream);
        connectedId.textContent = mediaConnection.remoteId;

        mediaConnection.on('stream', stream => {
            remoteVideo.srcObject = stream;
        });

        mediaConnection.once('close', () => {
            remoteVideo.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            remoteVideo.srcObject = null;
            connectedId.textContent = '...';
        });

        closeTrigger.addEventListener('click', () => {
            mediaConnection.close(true);
        });
    });

    callTrigger.addEventListener('click', () => {
        const mediaConnection = peer.call(remoteId.value, localStream);
        connectedId.textContent = mediaConnection.remoteId;

        mediaConnection.on('stream', stream => {
            remoteVideo.srcObject = stream;
        });

        mediaConnection.once('close', () => {
            remoteVideo.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            remoteVideo.srcObject = null;
            connectedId.textContent = '...';
        });

        closeTrigger.addEventListener('click', () => {
            mediaConnection.close(true);
        });
    });

    peer.on('error', console.error);
})();
