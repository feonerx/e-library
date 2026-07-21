/* Michael and Cecilia Ibru University E-Library
   Client-side demo data layer. All accounts, sessions, and loans are stored
   in the browser's localStorage — there is no real server, so this is for
   demonstration purposes only and must not be used to store real credentials. */

const MCIU = (() => {
  const USERS_KEY = "mciu_library_users";
  const SESSION_KEY = "mciu_library_session";
  const LOANS_KEY = "mciu_library_loans";
  const BOOKS_KEY = "mciu_library_books";

  const DEFAULT_BOOKS = [
    { id: "b1", title: "Principles of Modern Corporate Finance", author: "A. Enahoro", category: "Business" },
    { id: "b2", title: "Introduction to Petroleum Engineering", author: "T. Okonkwo", category: "Engineering" },
    { id: "b3", title: "Nigerian Legal System & Methods", author: "F. Adeyemi", category: "Law" },
    { id: "b4", title: "Clinical Anatomy for Medical Students", author: "Dr. C. Ibru-Peters", category: "Medicine" },
    { id: "b5", title: "Data Structures & Algorithms in Python", author: "S. Aluko", category: "Computer Science" },
    { id: "b6", title: "Mass Communication Theory", author: "N. Briggs", category: "Mass Communication" },
    { id: "b7", title: "Microeconomics for African Markets", author: "O. Balogun", category: "Business" },
    { id: "b8", title: "Organic Chemistry Essentials", author: "Prof. R. Nwosu", category: "Sciences" },
    { id: "b9", title: "Database Systems: Design & Implementation", author: "K. Effiong", category: "Computer Science" },
    { id: "b10", title: "Environmental Management in the Niger Delta", author: "M. Otuya", category: "Sciences" },
    { id: "b11", title: "Public International Law", author: "B. Ekanem", category: "Law" },
    { id: "b12", title: "Fundamentals of Mass Media Writing", author: "J. Ovie", category: "Mass Communication" },
  ];

  function seedBooks() {
    if (!localStorage.getItem(BOOKS_KEY)) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
    }
  }

  function getBooks() {
    seedBooks();
    return JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]");
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function signup({ fullName, matricNo, email, department, role, password }) {
    const users = getUsers();
    const emailLower = email.trim().toLowerCase();

    if (users.some((u) => u.email === emailLower)) {
      throw new Error("An account with this email already exists.");
    }
    if (users.some((u) => u.matricNo.toLowerCase() === matricNo.trim().toLowerCase())) {
      throw new Error("An account with this matric/staff ID already exists.");
    }

    const passwordHash = await hashPassword(password);
    const user = {
      fullName: fullName.trim(),
      matricNo: matricNo.trim(),
      email: emailLower,
      department,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);
    return user;
  }

  async function login({ identifier, password }) {
    const users = getUsers();
    const idLower = identifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.email === idLower || u.matricNo.toLowerCase() === idLower
    );

    if (!user) {
      throw new Error("No account found with that email or ID.");
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    localStorage.setItem(SESSION_KEY, user.email);
    return user;
  }

  function getCurrentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return getUsers().find((u) => u.email === email) || null;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getLoans() {
    return JSON.parse(localStorage.getItem(LOANS_KEY) || "{}");
  }

  function saveLoans(loans) {
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  }

  function borrowBook(email, bookId) {
    const loans = getLoans();
    loans[email] = loans[email] || [];
    if (loans[email].some((l) => l.bookId === bookId)) return;
    loans[email].push({ bookId, borrowedAt: new Date().toISOString() });
    saveLoans(loans);
  }

  function returnBook(email, bookId) {
    const loans = getLoans();
    loans[email] = (loans[email] || []).filter((l) => l.bookId !== bookId);
    saveLoans(loans);
  }

  function getUserLoans(email) {
    return getLoans()[email] || [];
  }

  function isBookBorrowedByAnyone(bookId, exceptEmail) {
    const loans = getLoans();
    return Object.entries(loans).some(
      ([email, items]) => email !== exceptEmail && items.some((l) => l.bookId === bookId)
    );
  }

  return {
    getBooks,
    signup,
    login,
    getCurrentUser,
    logout,
    borrowBook,
    returnBook,
    getUserLoans,
    isBookBorrowedByAnyone,
  };
})();

function mciuInitHeader() {
  const user = MCIU.getCurrentUser();
  const guestActions = document.getElementById("guestActions");
  const userChip = document.getElementById("userChip");
  const dashLink = document.getElementById("dashLink");

  if (user) {
    if (guestActions) guestActions.style.display = "none";
    if (userChip) {
      userChip.style.display = "inline-flex";
      const initials = user.fullName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      userChip.innerHTML = `<span class="avatar">${initials}</span>${user.fullName.split(" ")[0]}`;
      userChip.style.cursor = "pointer";
      userChip.addEventListener("click", () => {
        window.location.href = "./dashboard.html";
      });
    }
    if (dashLink) dashLink.style.display = "inline-flex";
  } else {
    if (userChip) userChip.style.display = "none";
    if (dashLink) dashLink.style.display = "none";
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      MCIU.logout();
      window.location.href = "./index.html";
    });
  }
}

function mciuRenderCatalog({ gridId, searchId, chipsId, emptyId, requireLoginToBorrow = true }) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const searchInput = searchId ? document.getElementById(searchId) : null;
  const chipsWrap = chipsId ? document.getElementById(chipsId) : null;
  const emptyState = emptyId ? document.getElementById(emptyId) : null;

  const books = MCIU.getBooks();
  const categories = ["All", ...new Set(books.map((b) => b.category))];
  let activeCategory = "All";
  let query = "";

  function currentUserEmail() {
    const u = MCIU.getCurrentUser();
    return u ? u.email : null;
  }

  function render() {
    const email = currentUserEmail();
    const filtered = books.filter((b) => {
      const matchesCategory = activeCategory === "All" || b.category === activeCategory;
      const matchesQuery =
        !query ||
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    grid.innerHTML = "";

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (emptyState) emptyState.style.display = "none";

    filtered.forEach((book) => {
      const borrowedByMe = email && MCIU.getUserLoans(email).some((l) => l.bookId === book.id);
      const borrowedByOthers = MCIU.isBookBorrowedByAnyone(book.id, email || "");
      const isTaken = borrowedByMe || borrowedByOthers;

      const card = document.createElement("article");
      card.className = "book-card";
      card.innerHTML = `
        <div class="book-cover">${book.category}</div>
        <div class="book-body">
          <span class="book-category">${book.category}</span>
          <h4>${book.title}</h4>
          <p class="author">by ${book.author}</p>
          <div class="book-meta">
            <span class="status ${isTaken ? "borrowed" : "available"}">
              ${borrowedByMe ? "Borrowed by you" : isTaken ? "Unavailable" : "Available"}
            </span>
            <button type="button" data-id="${book.id}">
              ${borrowedByMe ? "Return" : "Borrow"}
            </button>
          </div>
        </div>
      `;

      const btn = card.querySelector("button");
      if (!borrowedByMe && isTaken) {
        btn.disabled = true;
      }
      btn.addEventListener("click", () => {
        const currentEmail = currentUserEmail();
        if (!currentEmail) {
          if (requireLoginToBorrow) {
            window.location.href = "./login.html";
          }
          return;
        }
        if (borrowedByMe) {
          MCIU.returnBook(currentEmail, book.id);
        } else {
          MCIU.borrowBook(currentEmail, book.id);
        }
        render();
        if (typeof window.mciuOnCatalogChange === "function") {
          window.mciuOnCatalogChange();
        }
      });

      grid.appendChild(card);
    });
  }

  if (chipsWrap) {
    chipsWrap.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat;
      if (cat === activeCategory) btn.classList.add("active");
      btn.addEventListener("click", () => {
        activeCategory = cat;
        [...chipsWrap.children].forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        render();
      });
      chipsWrap.appendChild(btn);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      query = e.target.value.trim().toLowerCase();
      render();
    });
  }

  render();
  return render;
}
