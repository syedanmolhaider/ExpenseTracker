document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let transactions = [
    {
      id: 1,
      type: "expense",
      description: "Groceries",
      amount: 5500,
      category: "Food",
      date: "2025-09-27",
    },
    {
      id: 2,
      type: "expense",
      description: "Fuel",
      amount: 3000,
      category: "Transport",
      date: "2025-09-26",
    },
    {
      id: 3,
      type: "income",
      description: "Salary",
      amount: 150000,
      category: "Investments",
      date: "2025-09-25",
    },
    {
      id: 4,
      type: "expense",
      description: "Electricity Bill",
      amount: 8500,
      category: "Utilities",
      date: "2025-09-24",
    },
    {
      id: 5,
      type: "expense",
      description: "New headphones",
      amount: 12000,
      category: "Shopping",
      date: "2025-09-23",
    },
    {
      id: 6,
      type: "expense",
      description: "Dinner out",
      amount: 4200,
      category: "Food",
      date: "2025-09-22",
    },
    {
      id: 7,
      type: "expense",
      description: "Uber ride",
      amount: 750,
      category: "Transport",
      date: "2025-09-21",
    },
  ];
  let monthlyBudget = 100000;
  let editingId = null;

  // --- DOM ELEMENTS ---
  const addExpenseBtn = document.getElementById("add-expense-btn");
  const setBudgetBtn = document.getElementById("set-budget-btn");
  const expenseModal = document.getElementById("expense-modal");
  const budgetModal = document.getElementById("budget-modal");
  const cancelBtn = document.getElementById("cancel-btn");
  const cancelBudgetBtn = document.getElementById("cancel-budget-btn");
  const expenseForm = document.getElementById("expense-form");
  const budgetForm = document.getElementById("budget-form");
  const modalTitle = document.getElementById("modal-title");
  const transactionList = document.getElementById("transaction-list");
  const aiInsights = document.getElementById("ai-insights");
  const budgetSpentEl = document.getElementById("budget-spent");
  const budgetTotalEl = document.getElementById("budget-total");
  const budgetBar = document.getElementById("budget-bar");
  const tooltip = document.getElementById("tooltip");

  // --- 3D SCENE SETUP ---
  let scene, camera, renderer, crystal, raycaster, mouse;
  const meshes = [];
  const categoryColors = {
    Food: 0xff6384,
    Transport: 0x36a2eb,
    Utilities: 0xffce56,
    Shopping: 0x4bc0c0,
    Investments: 0x9966ff,
    Entertainment: 0xff9f40,
    Health: 0xc9cbcf,
    Other: 0x777777,
  };

  function init3D() {
    const container = document.getElementById("expense-canvas");
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    window.addEventListener("resize", onWindowResize, false);
    container.addEventListener("mousemove", onMouseMove, false);
    container.addEventListener("mousedown", onMouseDown, false);
    container.addEventListener("mouseup", onMouseUp, false);

    animate();
    updateCrystal();
  }

  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  function onMouseDown(event) {
    isDragging = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onMouseMove(event) {
    if (isDragging && crystal) {
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          toRadians(deltaMove.y * 1),
          toRadians(deltaMove.x * 1),
          0,
          "XYZ"
        )
      );

      crystal.quaternion.multiplyQuaternions(
        deltaRotationQuaternion,
        crystal.quaternion
      );

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  function updateCrystal() {
    if (crystal) {
      scene.remove(crystal);
      meshes.length = 0;
    }

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});

    const totalExpense = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );
    if (totalExpense === 0) return;

    crystal = new THREE.Group();

    const geometry = new THREE.IcosahedronGeometry(2, 0);

    let faceIndex = 0;
    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );

    for (const [category, amount] of sortedCategories) {
      if (faceIndex >= geometry.faces.length) break;

      const material = new THREE.MeshPhongMaterial({
        color: categoryColors[category] || 0xffffff,
        emissive: categoryColors[category] || 0xffffff,
        emissiveIntensity: 0.4,
        shininess: 100,
        specular: 0x111111,
        transparent: true,
        opacity: 0.8,
      });

      const face = geometry.faces[faceIndex];
      const triangleGeometry = new THREE.Geometry();
      triangleGeometry.vertices.push(
        geometry.vertices[face.a],
        geometry.vertices[face.b],
        geometry.vertices[face.c]
      );
      triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
      triangleGeometry.computeFaceNormals();

      const mesh = new THREE.Mesh(triangleGeometry, material);
      mesh.userData = { category, amount, total: totalExpense };
      crystal.add(mesh);
      meshes.push(mesh);
      faceIndex++;
    }

    scene.add(crystal);
  }

  function onWindowResize() {
    const container = document.getElementById("expense-canvas");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const data = intersects[0].object.userData;
      tooltip.style.display = "block";
      tooltip.style.left = `${
        mouse.x * (renderer.domElement.clientWidth / 2) +
        renderer.domElement.clientWidth / 2 +
        10
      }px`;
      tooltip.style.top = `${
        -mouse.y * (renderer.domElement.clientHeight / 2) +
        renderer.domElement.clientHeight / 2 +
        10
      }px`;
      const percentage = ((data.amount / data.total) * 100).toFixed(1);
      tooltip.innerHTML = `${
        data.category
      }<br>PKR ${data.amount.toLocaleString()}<br>(${percentage}%)`;
      document.body.style.cursor = "pointer";
    } else {
      tooltip.style.display = "none";
      document.body.style.cursor = "default";
    }

    if (!isDragging && crystal) {
      crystal.rotation.y += 0.002;
      crystal.rotation.x += 0.0005;
    }

    renderer.render(scene, camera);
  }

  // --- UI RENDERING ---
  function renderTransactions() {
    transactionList.innerHTML = "";
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    sortedTransactions.forEach((t) => {
      const isExpense = t.type === "expense";
      const sign = isExpense ? "-" : "+";
      const color = isExpense ? "text-red-400" : "text-green-400";
      const item = document.createElement("div");
      item.className =
        "flex justify-between items-center p-2 border-b border-gray-700 hover:bg-gray-800 rounded";
      item.innerHTML = `
                        <div>
                            <p class="font-bold">${t.description}</p>
                            <p class="text-xs text-gray-400">${t.category} - ${
        t.date
      }</p>
                        </div>
                        <div class="text-right">
                           <p class="font-bold ${color}">${sign}PKR ${t.amount.toLocaleString()}</p>
                            <div>
                                <button class="edit-btn text-xs text-blue-400 hover:text-blue-200" data-id="${
                                  t.id
                                }">Edit</button>
                                <button class="delete-btn text-xs text-red-400 hover:red-200" data-id="${
                                  t.id
                                }">Del</button>
                            </div>
                        </div>
                    `;
      transactionList.appendChild(item);
    });
  }

  function renderBudget() {
    const totalSpent = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    budgetSpentEl.textContent = `PKR ${totalSpent.toLocaleString()}`;
    budgetTotalEl.textContent = `PKR ${monthlyBudget.toLocaleString()}`;
    const percentage = Math.min((totalSpent / monthlyBudget) * 100, 100);
    budgetBar.style.width = `${percentage}%`;
    if (percentage > 80 && percentage < 100) {
      budgetBar.classList.remove("from-blue-500", "to-pink-500");
      budgetBar.classList.add("from-yellow-500", "to-orange-500");
    } else if (percentage >= 100) {
      budgetBar.classList.remove("from-yellow-500", "to-orange-500");
      budgetBar.classList.add("from-red-500", "to-pink-500");
    } else {
      budgetBar.classList.remove(
        "from-yellow-500",
        "to-orange-500",
        "from-red-500",
        "to-pink-500"
      );
      budgetBar.classList.add("from-blue-500", "to-pink-500");
    }
  }

  function renderAIInsights() {
    aiInsights.innerHTML = "";
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // 1. Highest Expense Tracker
    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});
    const top3 = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let insightHTML =
      '<div class="mb-4"><strong>Top 3 Spending Habits:</strong><ul class="list-disc pl-5">';
    top3.forEach(([cat, amt]) => {
      insightHTML += `<li>${cat}: PKR ${amt.toLocaleString()}</li>`;
    });
    insightHTML += "</ul></div>";

    // 2. High-spending alert + suggestion
    if (top3.length > 0) {
      const topCategory = top3[0][0];
      const topAmount = top3[0][1];
      const percentage = ((topAmount / totalExpense) * 100).toFixed(0);

      if (percentage > 25) {
        insightHTML += `<div class="p-3 bg-yellow-900/50 border border-yellow-500 rounded">
                            <p class="font-bold">Alert!</p>
                            <p>${topCategory} makes up ${percentage}% of your spending.
                            ${getSuggestion(topCategory)}</p>
                         </div>`;
      }
    }

    // 3. Predictive forecast (simple version)
    const daysInMonth = 30;
    const daysPassed = new Date().getDate();
    const avgDailySpend = totalExpense / daysPassed;
    const projectedSpend = avgDailySpend * daysInMonth;
    insightHTML += `<div class="mt-4"><strong>Expense Forecast:</strong> Based on current spending, you are on track to spend ~<strong>PKR ${Math.round(
      projectedSpend
    ).toLocaleString()}</strong> this month.</div>`;

    aiInsights.innerHTML = insightHTML;
  }

  function getSuggestion(category) {
    const suggestions = {
      Food: "Consider planning meals for the week or looking for deals at local markets.",
      Transport:
        "You could save significantly by using public transport or carpooling on some days.",
      Shopping:
        'Try setting a "cool-off" period of 24 hours before making non-essential purchases.',
      Entertainment:
        "Look for free events in your city or subscription services that offer more value.",
      Utilities:
        "Unplugging electronics when not in use can help lower your electricity bill.",
    };
    return (
      suggestions[category] ||
      "Review your spending in this category for potential savings."
    );
  }

  // --- CHARTS ---
  let expenseChart;
  function renderChart() {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    const data = {
      labels: last7Days,
      datasets: [
        {
          label: "Daily Expense (PKR)",
          data: last7Days.map((day) =>
            transactions
              .filter((t) => t.type === "expense" && t.date === day)
              .reduce((sum, t) => sum + t.amount, 0)
          ),
          borderColor: "rgba(0, 191, 255, 1)",
          backgroundColor: "rgba(0, 191, 255, 0.2)",
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: "white",
          pointBorderColor: "rgba(0, 191, 255, 1)",
        },
      ],
    };

    if (expenseChart) {
      expenseChart.data = data;
      expenseChart.update();
    } else {
      expenseChart = new Chart(ctx, {
        type: "line",
        data: data,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#E0E0E0" },
            },
            x: {
              grid: { color: "rgba(255,255,255,0.1)" },
              ticks: { color: "#E0E0E0" },
            },
          },
          plugins: { legend: { labels: { color: "#E0E0E0" } } },
        },
      });
    }
  }

  // --- MODAL & FORM HANDLING ---
  function showModal(isEdit = false, data = null) {
    expenseForm.reset();
    editingId = null;
    if (isEdit && data) {
      modalTitle.textContent = "Edit Transaction";
      document.getElementById("expense-id").value = data.id;
      document.getElementById("type").value = data.type;
      document.getElementById("description").value = data.description;
      document.getElementById("amount").value = data.amount;
      document.getElementById("category").value = data.category;
      editingId = data.id;
    } else {
      modalTitle.textContent = "Add Transaction";
    }
    expenseModal.classList.remove("hidden");
  }

  function hideModal() {
    expenseModal.classList.add("hidden");
  }

  function showBudgetModal() {
    document.getElementById("budget-amount").value = monthlyBudget;
    budgetModal.classList.remove("hidden");
  }

  function hideBudgetModal() {
    budgetModal.classList.add("hidden");
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTransaction = {
      id: editingId || Date.now(),
      type: document.getElementById("type").value,
      description: document.getElementById("description").value,
      amount: parseInt(document.getElementById("amount").value),
      category: document.getElementById("category").value,
      date: new Date().toISOString().split("T")[0],
    };

    if (editingId) {
      transactions = transactions.map((t) =>
        t.id === editingId ? newTransaction : t
      );
    } else {
      transactions.push(newTransaction);
    }

    hideModal();
    updateAll();
  });

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newBudget = parseInt(document.getElementById("budget-amount").value);
    if (newBudget > 0) {
      monthlyBudget = newBudget;
      hideBudgetModal();
      updateAll();
    }
  });

  transactionList.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const id = parseInt(e.target.dataset.id);
      const transaction = transactions.find((t) => t.id === id);
      showModal(true, transaction);
    }
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id);
      transactions = transactions.filter((t) => t.id !== id);
      updateAll();
    }
  });

  // --- EVENT LISTENERS ---
  addExpenseBtn.addEventListener("click", () => showModal());
  setBudgetBtn.addEventListener("click", showBudgetModal);
  cancelBtn.addEventListener("click", hideModal);
  cancelBudgetBtn.addEventListener("click", hideBudgetModal);

  // --- INITIALIZATION ---
  function updateAll() {
    renderTransactions();
    renderBudget();
    renderAIInsights();
    renderChart();
    updateCrystal();
  }

  init3D();
  updateAll();
});
