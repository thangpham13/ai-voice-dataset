async function loadData() {
  const res = await fetch("/data");
  const data = await res.json();

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach((row, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${row.text}</td>
      <td>
        <audio controls src="/audio/${row.file}"></audio>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

loadData();
