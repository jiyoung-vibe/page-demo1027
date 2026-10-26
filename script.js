// Supabase 주소와 공개 키 (공개 키는 화면에 보여도 되는 키입니다. 비밀 키는 쓰지 않습니다.)
const SUPABASE_URL = "https://ikkbxhujwyqbijevwltf.supabase.co";
const SUPABASE_KEY = "sb_publishable_BG6JIXjUuqZbazxM_aIabw_S5jmz97C";
const TABLE_URL = SUPABASE_URL + "/rest/v1/guestbook";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const submitButton = document.getElementById("submit-button");
const list = document.getElementById("guestbook-list");

// 목록 맨 위에 안내 문구 한 줄을 보여 줍니다.
function showNotice(text) {
  list.textContent = "";
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

// 글을 최신순으로 불러와서 목록에 그립니다.
async function loadEntries() {
  try {
    const response = await fetch(
      TABLE_URL + "?select=nickname,message,created_at&order=created_at.desc",
      { headers: headers }
    );
    if (!response.ok) {
      throw new Error("status " + response.status);
    }
    const entries = await response.json();
    if (entries.length === 0) {
      showNotice("아직 글이 없어요. 첫 글을 남겨 보세요!");
      return;
    }
    list.textContent = "";
    entries.forEach(function (entry) {
      const li = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = entry.nickname;
      const text = document.createElement("span");
      text.textContent = " " + entry.message;
      li.appendChild(name);
      li.appendChild(text);
      list.appendChild(li);
    });
  } catch (error) {
    showNotice("목록을 불러오지 못했어요. 잠시 뒤에 다시 해 보세요.");
  }
}

// 남기기를 누르면 글을 저장하고 목록을 다시 불러옵니다.
async function addEntry() {
  const nickname = nicknameInput.value.trim();
  const message = messageInput.value.trim();

  if (nickname === "" || message === "") {
    alert("별명과 한마디를 모두 적어 주세요.");
    return;
  }
  if (nickname.length > 20) {
    alert("별명은 20글자까지만 쓸 수 있어요.");
    return;
  }
  if (message.length > 500) {
    alert("한마디는 500글자까지만 쓸 수 있어요.");
    return;
  }

  submitButton.disabled = true;
  try {
    const response = await fetch(TABLE_URL, {
      method: "POST",
      headers: Object.assign({ Prefer: "return=minimal" }, headers),
      body: JSON.stringify({ nickname: nickname, message: message })
    });
    if (!response.ok) {
      throw new Error("status " + response.status);
    }
    nicknameInput.value = "";
    messageInput.value = "";
    await loadEntries();
  } catch (error) {
    alert("글을 남기지 못했어요. 잠시 뒤에 다시 해 보세요.");
  } finally {
    submitButton.disabled = false;
  }
}

submitButton.addEventListener("click", addEntry);
loadEntries();
