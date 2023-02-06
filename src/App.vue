<template>
  <div class="local-video">
    <video ref="local" autoplay playsinline muted></video>
  </div>
  <div class="remote-video">
    <video ref="remote" autoplay playsinline muted></video>
  </div>

  <div>
    <input type="text" v-model="userInfo.roomId" placeholder="房间号" />
  </div>
  <div><input type="text" v-model="userInfo.nick" placeholder="昵称" /></div>

  <button @click="init">进入</button>
  <button @click="close">关闭</button>
</template>
<script setup>
import { ref, reactive } from "vue";
import { io, Socket } from "socket.io-client";

const userInfo = reactive({
  roomId: "",
  nick: "",
});

const socket = io("ws://192.168.0.176:3000", {
  query: {
    room: userInfo.roomId,
    nick: userInfo.nick,
  },
});
const value = ref("");
let local = ref(null);
let remote = ref(null);
const init = async () => {
  const pc = new RTCPeerConnection();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  local.value.srcObject = stream;
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("offer", { creatorUserId: value.value, offer: offer });

  socket.on("offer", async (offer) => {
    await pc.setRemoteDescription(offer.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { answer });
  });
  socket.on("answer", async (answer) => {
    await pc.setRemoteDescription(answer.answer);
  });
  pc.onicecandidate = (candidateInfo) => {
    if (candidateInfo.candidate) {
      socket.emit("ICE-candidate", { sdp: candidateInfo.candidate });
    }
  };
  socket.on("ICE-candidate", async (data) => {
    await pc.addIceCandidate(data.sdp);
  });
  pc.ontrack = (track) => {
    if (track.track.kind === "video") {
      const video = remote.value;
      console.log(track);
      video.srcObject = track.streams[0];
    }
    if (track.track.kind === "audio") {
      const audio = document.createElement("audio");
      audio.srcObject = track.streams[0];
      audio.autoplay = true;
      audio.setAttribute("id", track.track.id);
      document.body.appendChild(audio);
    }
  };
};
</script>
<style scoped>
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.local-video {
  background-color: #000;
  width: 200px;
  height: 100px;
  border: 1px solid pink;
}
.remote-video {
  width: 200px;
  height: 100px;
  border: 1px solid pink;
  background-color: #000;
}
</style>
