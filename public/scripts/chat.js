const [userInputFormElement] = document.getElementsByTagName("form");
const userInputElement = document.getElementById("text");
const chatsDisplayElement = document.getElementById("chats");

const groupId = userInputFormElement.dataset.groupId;
const userId = userInputFormElement.dataset.userId;
const userName = userInputFormElement.dataset.userName;

const formSubmissionPath = "/chatroom/" + groupId;

userInputFormElement.addEventListener("submit", async function (event) {
  event.preventDefault();

  let formData = new FormData(event.target);

  const data = Object.fromEntries(formData.entries());

  userInputElement.value = "";

  // console.log(data);

  // Add the new msg to chat list
  const newMsgElement = document.createElement("p");
  newMsgElement.className = "sent";
  newMsgElement.innerHTML = data.text;

  chatsDisplayElement.prepend(newMsgElement);

  // Send the msg to all other users
  try {
    const result = await fetch(formSubmissionPath, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!result.ok) {
      console.log("Failed sending Data to server");
      console.log(result);
    }
  } catch (err) {
    console.log("Failed sending Data to server");
    console.log(err);
  }
});

let ws = new WebSocket("ws://localhost:3080");

ws.addEventListener("error", console.error);

ws.addEventListener("open", function () {
  console.log("Connected to Server through Sockets");
  ws.send(
    JSON.stringify({
      userId: userId,
      groupId: groupId,
    })
  );
});

ws.addEventListener("message", function (msgEvent) {
  console.log(msgEvent.data);
  let recievedMsg;
  try {
    recievedMsg = JSON.parse(msgEvent.data);
  } catch (err) {
    console.err(err);
  }
  newMsgElement = document.createElement("div");
  newMsgElement.className="recieved"
  newMsgElement.innerHTML = `
        <p class="sender-name">${recievedMsg.senderName}</p>
        <p class="text">${recievedMsg.msg}</p>
    `;

  chatsDisplayElement.prepend(newMsgElement);
});

ws.addEventListener("close", function () {
  console.log("Connection to Server Lost! Socket Closed!");
});
