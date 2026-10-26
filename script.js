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

// ---- 사진 올리기와 갤러리 ----
const STORAGE_URL = SUPABASE_URL + "/storage/v1/object";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const photoInput = document.getElementById("photo-input");
const photoButton = document.getElementById("photo-button");
const photoNotice = document.getElementById("photo-notice");
const gallery = document.getElementById("gallery");

// 영어·숫자로만 된 새 파일 이름을 만듭니다. (예: 1767225600000-a1b2c3.jpg)
function makePhotoName(extension) {
  const random = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return Date.now() + "-" + random + "." + extension;
}

// 올린 사진을 최신순으로 불러와 갤러리에 보여 줍니다.
async function loadPhotos() {
  try {
    const response = await fetch(STORAGE_URL + "/list/photos", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        prefix: "",
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      })
    });
    if (!response.ok) {
      throw new Error("status " + response.status);
    }
    const files = (await response.json()).filter(function (file) {
      return file.name !== ".emptyFolderPlaceholder";
    });
    gallery.textContent = "";
    if (files.length === 0) {
      gallery.textContent = "아직 사진이 없어요.";
      return;
    }
    files.forEach(function (file) {
      const img = document.createElement("img");
      img.src = STORAGE_URL + "/public/photos/" + encodeURIComponent(file.name);
      img.alt = "올린 사진";
      img.loading = "lazy";
      gallery.appendChild(img);
    });
  } catch (error) {
    gallery.textContent = "사진을 불러오지 못했어요.";
  }
}

// 올리기를 누르면 검사하고, 통과한 사진을 보관함에 올립니다.
async function uploadPhoto() {
  const file = photoInput.files[0];
  photoNotice.textContent = "";

  if (!file) {
    photoNotice.textContent = "사진을 먼저 골라 주세요.";
    return;
  }
  const extension = PHOTO_TYPES[file.type];
  if (!extension) {
    photoNotice.textContent = "사진 파일(jpg, png, webp)만 올릴 수 있어요.";
    return;
  }
  if (file.size > MAX_PHOTO_SIZE) {
    photoNotice.textContent = "사진은 5MB까지만 올릴 수 있어요.";
    return;
  }

  photoButton.disabled = true;
  try {
    const response = await fetch(STORAGE_URL + "/photos/" + makePhotoName(extension), {
      method: "POST",
      headers: Object.assign({}, headers, { "Content-Type": file.type }),
      body: file
    });
    if (!response.ok) {
      throw new Error("status " + response.status);
    }
    photoInput.value = "";
    await loadPhotos();
  } catch (error) {
    photoNotice.textContent = "사진을 올리지 못했어요. 잠시 뒤에 다시 해 보세요.";
  } finally {
    photoButton.disabled = false;
  }
}

photoButton.addEventListener("click", uploadPhoto);
loadPhotos();
