document.addEventListener("DOMContentLoaded", function () {

    // ====================================
    // 1. GET HTML ELEMENTS
    // ====================================

    const imageInput = document.getElementById("wasteImage");
    const imagePreview = document.getElementById("imagePreview");
    const detectButton = document.getElementById("detectButton");
    const detectionResult = document.getElementById("detectionResult");

    const binList = document.getElementById("bin-list");
    const binSelect = document.getElementById("binSelect");
    const fillLevel = document.getElementById("fillLevel");
    const fillValue = document.getElementById("fillValue");
    const updateBinButton = document.getElementById("updateBinButton");

    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");
    const clearHistoryButton = document.getElementById("clearHistoryButton");

    let selectedImage = null;
    let model = null;
    let previewURL = null;


    // ====================================
    // 2. LOAD SAVED DATA
    // ====================================

    function loadData(key, fallback) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (error) {
            console.error("Could not load saved data:", error);
            return fallback;
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error("Could not save data:", error);
            alert("Browser storage is unavailable. Your changes may not be saved.");
        }
    }


    // ====================================
    // 3. SMART BIN DATA
    // ====================================

    const defaultBins = [
        {
            id: 1,
            name: "Plastic Bin",
            zone: "Zone A",
            fill: 85
        },
        {
            id: 2,
            name: "Organic Bin",
            zone: "Zone B",
            fill: 45
        },
        {
            id: 3,
            name: "Paper Bin",
            zone: "Zone C",
            fill: 95
        }
    ];

    let bins = loadData("ecosortBins", defaultBins);

    if (!Array.isArray(bins) || bins.length === 0) {
        bins = defaultBins;
    }


    // ====================================
    // 4. GET BIN STATUS
    // ====================================

    function getBinStatus(fill) {

        if (fill >= 90) {
            return {
                text: "Urgent Collection",
                type: "urgent"
            };
        }

        if (fill >= 75) {
            return {
                text: "Collection Required",
                type: "high"
            };
        }

        return {
            text: "Normal",
            type: "normal"
        };
    }


    // ====================================
    // 5. DISPLAY SMART BINS
    // ====================================

    function renderBins() {

        binList.innerHTML = "";

        bins.forEach(function (bin) {

            const status = getBinStatus(bin.fill);

            let fillClass = "low";

            if (bin.fill >= 75) {
                fillClass = "high";
            } else if (bin.fill >= 50) {
                fillClass = "medium";
            }

            const card = document.createElement("div");
            card.className = "bin-card";

            const heading = document.createElement("h3");
            heading.textContent = bin.name + " - " + bin.zone;

            const percentage = document.createElement("p");
            percentage.textContent = "Fill Level: " + bin.fill + "%";

            const progress = document.createElement("div");
            progress.className = "progress";

            const bar = document.createElement("div");
            bar.className = "progress-fill " + fillClass;
            bar.style.width = bin.fill + "%";

            progress.appendChild(bar);

            const statusText = document.createElement("strong");
            statusText.textContent = status.text;
            statusText.style.color =
                status.type === "urgent" ? "#d9534f" :
                status.type === "high" ? "#c27b13" :
                "#278657";

            card.appendChild(heading);
            card.appendChild(percentage);
            card.appendChild(progress);
            card.appendChild(statusText);

            binList.appendChild(card);
        });

        updateDashboardStats();
    }


    // ====================================
    // 6. UPDATE DASHBOARD STATISTICS
    // ====================================

    function updateDashboardStats() {

        const pending = bins.filter(function (bin) {
            return bin.fill >= 75;
        }).length;

        document.getElementById("activeBinCount").textContent =
            bins.length;

        document.getElementById("pendingBinCount").textContent =
            pending;

        document.getElementById("reportPending").textContent =
            pending;

        document.getElementById("reportUrgent").textContent =
            bins.filter(function (bin) {
                return bin.fill >= 90;
            }).length;
    }


    // ====================================
    // 7. COLLECTION PLANNER
    // ====================================

    function renderCollectionPlan() {

        const collectionPlan =
            document.getElementById("collectionPlan");

        const collectionSummary =
            document.getElementById("collectionSummary");

        collectionPlan.innerHTML = "";
        collectionSummary.innerHTML = "";

        const urgent = bins.filter(bin => bin.fill >= 90).length;

        const high = bins.filter(bin =>
            bin.fill >= 75 && bin.fill < 90
        ).length;

        const normal = bins.filter(bin => bin.fill < 75).length;

        collectionSummary.innerHTML = `
            <div class="summary-grid">

                <div class="summary-card">
                    <h3>Urgent</h3>
                    <h2 style="color:#d9534f;">${urgent}</h2>
                </div>

                <div class="summary-card">
                    <h3>High Priority</h3>
                    <h2 style="color:#c27b13;">${high}</h2>
                </div>

                <div class="summary-card">
                    <h3>Normal</h3>
                    <h2 style="color:#278657;">${normal}</h2>
                </div>

            </div>
        `;

        // Sort bins from fullest to least full
        const sortedBins = [...bins].sort(function (a, b) {
            return b.fill - a.fill;
        });

        sortedBins.forEach(function (bin, index) {

            const status = getBinStatus(bin.fill);

            const item = document.createElement("div");
            item.className = "priority-item " + status.type;

            const information = document.createElement("div");

            const title = document.createElement("h4");
            title.textContent =
                (index + 1) + ". " + bin.name + " - " + bin.zone;

            const details = document.createElement("p");
            details.textContent = "Current fill level: " + bin.fill + "%";

            information.appendChild(title);
            information.appendChild(details);

            const label = document.createElement("div");
            label.className = "priority-label " + status.type;
            label.textContent = status.text;

            item.appendChild(information);
            item.appendChild(label);

            collectionPlan.appendChild(item);
        });

        updateDashboardStats();
    }


    // ====================================
    // 8. UPDATE BIN FILL LEVEL
    // ====================================

    function populateBinSelect() {

        binSelect.innerHTML = "";

        bins.forEach(function (bin) {

            const option = document.createElement("option");

            option.value = bin.id;
            option.textContent =
                bin.name + " - " + bin.zone;

            binSelect.appendChild(option);
        });

        if (bins.length > 0) {
            fillLevel.value = bins[0].fill;
            fillValue.textContent = bins[0].fill + "%";
        }
    }

    binSelect.addEventListener("change", function () {

        const selectedBin = bins.find(function (bin) {
            return bin.id === Number(binSelect.value);
        });

        if (selectedBin) {
            fillLevel.value = selectedBin.fill;
            fillValue.textContent = selectedBin.fill + "%";
        }
    });

    fillLevel.addEventListener("input", function () {

        fillValue.textContent = fillLevel.value + "%";

    });

    updateBinButton.addEventListener("click", function () {

        const selectedBin = bins.find(function (bin) {
            return bin.id === Number(binSelect.value);
        });

        if (!selectedBin) {
            alert("Please select a bin.");
            return;
        }

        selectedBin.fill = Number(fillLevel.value);

        saveData("ecosortBins", bins);

        renderBins();
        renderCollectionPlan();

        alert("Bin fill level updated successfully!");
    });


    // ====================================
    // 9. WASTE CATEGORY CLASSIFICATION
    // ====================================

    function getWasteCategory(label) {

        const name = label.toLowerCase();

        if (
            name.includes("cellular telephone") ||
            name.includes("remote control") ||
            name.includes("computer keyboard") ||
            name.includes("laptop") ||
            name.includes("monitor") ||
            name.includes("printer") ||
            name.includes("desktop computer")
        ) {
            return "E-Waste";
        }

        if (
            name.includes("banana") ||
            name.includes("apple") ||
            name.includes("orange") ||
            name.includes("lemon") ||
            name.includes("strawberry") ||
            name.includes("pineapple") ||
            name.includes("broccoli") ||
            name.includes("carrot") ||
            name.includes("mushroom") ||
            name.includes("cucumber") ||
            name.includes("potato")
        ) {
            return "Organic Waste";
        }

        if (
            name.includes("wine bottle") ||
            name.includes("beer bottle") ||
            name.includes("goblet") ||
            name.includes("drinking glass")
        ) {
            return "Glass";
        }

        if (
            name.includes("water bottle") ||
            name.includes("pop bottle") ||
            name.includes("plastic bag") ||
            name.includes("pill bottle")
        ) {
            return "Plastic";
        }

        if (
            name.includes("tin can") ||
            name.includes("beer can") ||
            name.includes("pop can")
        ) {
            return "Metal";
        }

        if (
            name.includes("newspaper") ||
            name.includes("envelope") ||
            name.includes("comic book") ||
            name.includes("paper towel") ||
            name.includes("toilet tissue") ||
            name.includes("notebook")
        ) {
            return "Paper";
        }

        if (
            name.includes("book") ||
            name.includes("bottle") ||
            name.includes("jar")
        ) {
            return "Uncertain - Check Material";
        }

        return "Other / Needs Manual Sorting";
    }


    // ====================================
    // 10. WASTE DETECTION HISTORY
    // ====================================

    let history = loadData("ecosortDetectionHistory", []);

    if (!Array.isArray(history)) {
        history = [];
    }

    function renderHistory() {

        historyCount.textContent =
            "Total detections: " + history.length;

        historyList.innerHTML = "";

        if (history.length === 0) {

            historyList.textContent =
                "No waste detections recorded yet.";

        } else {

            history.slice(0, 10).forEach(function (record) {

                const item = document.createElement("div");
                item.className = "history-item";

                const objectName = document.createElement("strong");
                objectName.textContent = record.object;

                const category = document.createElement("p");
                category.textContent =
                    "Category: " + record.category;

                const confidence = document.createElement("p");
                confidence.textContent =
                    "Confidence: " +
                    (record.confidence * 100).toFixed(1) + "%";

                const date = document.createElement("small");
                date.textContent =
                    new Date(record.time).toLocaleString();

                item.appendChild(objectName);
                item.appendChild(category);
                item.appendChild(confidence);
                item.appendChild(date);

                historyList.appendChild(item);
            });
        }

        document.getElementById("reportDetections").textContent =
            history.length;
    }


    // Save AI detection
    function saveDetection(prediction, category) {

        const record = {
            object: prediction.className,
            category: category,
            confidence: prediction.probability,
            time: new Date().toISOString()
        };

        history.unshift(record);

        history = history.slice(0, 10);

        saveData("ecosortDetectionHistory", history);

        renderHistory();
    }


    // Clear saved history
    clearHistoryButton.addEventListener("click", function () {

        if (!confirm("Are you sure you want to clear detection history?")) {
            return;
        }

        history = [];

        saveData("ecosortDetectionHistory", history);

        renderHistory();
    });


    // ====================================
    // 11. IMAGE UPLOAD AND PREVIEW
    // ====================================

    imageInput.addEventListener("change", function () {

        const file = imageInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image.");
            imageInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image must be smaller than 5 MB.");
            imageInput.value = "";
            return;
        }

        selectedImage = file;

        if (previewURL) {
            URL.revokeObjectURL(previewURL);
        }

        previewURL = URL.createObjectURL(file);

        imagePreview.innerHTML = "";

        const img = document.createElement("img");

        img.src = previewURL;
        img.alt = "Uploaded waste image";
        img.style.width = "100%";
        img.style.maxWidth = "300px";
        img.style.maxHeight = "250px";
        img.style.objectFit = "contain";
        img.style.margin = "15px auto";
        img.style.display = "block";

        imagePreview.appendChild(img);

        const message = document.createElement("p");

        message.textContent = "Image uploaded successfully!";

        imagePreview.appendChild(message);

        detectionResult.textContent =
            "Image ready for classification.";
    });


    // ====================================
    // 12. AI WASTE DETECTION
    // ====================================

    detectButton.addEventListener("click", async function () {

        if (!selectedImage) {
            alert("Please upload a waste image first!");
            return;
        }

        const img = imagePreview.querySelector("img");

        if (!img || !img.complete || img.naturalWidth === 0) {

            detectionResult.textContent =
                "Please upload the image again.";

            return;
        }

        detectButton.disabled = true;

        detectionResult.textContent =
            "Loading AI model and analysing image...";

        try {

            // Load MobileNet model
            if (!model) {

                if (!window.tf || !window.mobilenet) {
                    throw new Error(
                        "AI libraries did not load. Check your internet connection."
                    );
                }

                model = await window.mobilenet.load();
            }

            // Classify uploaded image
            const predictions = await model.classify(img, 3);

            const bestPrediction = predictions[0];

            const category = getWasteCategory(
                bestPrediction.className
            );

            const confidence =
                (bestPrediction.probability * 100).toFixed(1);

            detectionResult.innerHTML = "";

            const heading = document.createElement("h3");
            heading.textContent = "AI Analysis Result";

            detectionResult.appendChild(heading);

            const objectText = document.createElement("p");

            objectText.textContent =
                "Recognised object: " + bestPrediction.className;

            detectionResult.appendChild(objectText);

            const categoryText = document.createElement("p");

            categoryText.textContent =
                "Suggested waste category: " + category;

            detectionResult.appendChild(categoryText);

            const confidenceText = document.createElement("p");

            confidenceText.textContent =
                "Model confidence: " + confidence + "%";

            detectionResult.appendChild(confidenceText);


            // Confidence warning
            const note = document.createElement("small");

            if (bestPrediction.probability < 0.60) {

                note.textContent =
                    "⚠️ Low confidence! Please manually verify this waste category.";

                note.style.color = "#d97706";
                note.style.fontWeight = "bold";

            } else {

                note.textContent =
                    "AI prediction completed. Please verify the category before disposal.";
            }

            detectionResult.appendChild(note);


            // Other AI predictions
            const listHeading = document.createElement("h4");

            listHeading.textContent = "Other AI predictions:";

            detectionResult.appendChild(listHeading);

            predictions.forEach(function (prediction) {

                const item = document.createElement("p");

                item.textContent =
                    prediction.className + " — " +
                    (prediction.probability * 100).toFixed(1) + "%";

                detectionResult.appendChild(item);
            });


            // Save detection to collection log
            saveDetection(bestPrediction, category);

        } catch (error) {

            console.error("AI detection error:", error);

            detectionResult.textContent =
                "AI detection failed: " + error.message +
                " Please check your internet connection and reload the page.";

        } finally {

            detectButton.disabled = false;

        }

    });


    // ====================================
    // 13. START THE APPLICATION
    // ====================================

    populateBinSelect();

    renderBins();

    renderCollectionPlan();

    renderHistory();

});