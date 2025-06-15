const [userInputFormElement] = document.getElementsByTagName("form");
const userInputElement = document.getElementById("text");

const formSubmissionPath = userInputFormElement.action;

userInputFormElement.addEventListener("submit", async function (event) {
  event.preventDefault();

  let formData = new FormData(event.target);

  const data = Object.fromEntries(formData.entries());

  userInputElement.value = "";

  console.log(data);

  try {
    const result = await fetch(formSubmissionPath, {
      method: "POST",
      body: JSON.stringify(data),
      headers : {
        "Content-Type":"application/json"
      }
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
