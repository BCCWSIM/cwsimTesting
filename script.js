document.addEventListener('DOMContentLoaded', () => {
    // Modal initialization
    const modal = document.getElementById("myModal");
    const closeModalButton = modal.querySelector(".close");
    modal.style.display = "none";

    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }

    let items = [];
    let headers, indices = {};

    // Fetch the configuration CSV for title and logos
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQFs1QTm7qtKV8JLHabFU6vJWNTv-m9OP8M2BkDqX0ooSWqdXALW-UJ2UZAN5NFrY6R_HEH6--SdVa7/pub?output=csv')
        .then(response => response.text())
        .then(configData => {
            const configItems = parseCSV(configData);
            const configHeaders = configItems[0];
            initializeIndices(['Title', 'Logo1', 'Logo2'], configHeaders);
            setTitleAndLogos(configItems[1]); // Set title and logos from the first row
            return fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vT5qcq-QHtDeJHajLkcTHSwI5JsJndZotORtxyBjt1u1VLqOdLZx94RKdda1c064dUd0TBxRQAeippH/pub?output=csv');
        })
        .then(response => response.text())
        .then(csvData => {
            items = parseCSV(csvData);
            headers = items[0];
            initializeIndices(['SKU', 'SKUVAR', 'SKUName', 'QuantityLimit', 'Quantity', 'Category', 'SubCategory', 'Thumbnails']);
            initializeGallery();
        })
        .catch(error => console.error('Error fetching CSV:', error));

    function parseCSV(csvData) {
        return csvData.split('\n')
            .filter(row => row.trim().length > 0)
            .map(row => row.split(',').map(cell => cell.trim()));
    }

    function initializeIndices(requiredHeaders, csvHeaders) {
        requiredHeaders.forEach(header => {
            indices[header] = csvHeaders.indexOf(header);
            if (indices[header] === -1) {
                console.error(`Header ${header} not found.`);
            }
        });
    }

    function setTitleAndLogos(firstRow) {
        // Set the title from the CSV
        document.title = firstRow[indices['Title']] || 'Simquipment';

        // Set the logo images from the CSV
        const logo1Url = firstRow[indices['Logo1']];
        const logo2Url = firstRow[indices['Logo2']];
        
        const logos = document.querySelectorAll('.logo1');
        logos[0].src = logo1Url;
        logos[1].src = logo2Url;
    }

    function initializeGallery() {
        const categories = new Set(items.slice(1).map(item => item[indices['Category']] || ''));
        const galleryContainer = document.getElementById('galleryContainer');

        const categorySelect = createDropdown('categorySelect', categories);
        const subcategorySelect = createDropdown('subcategorySelect', new Set());

        categorySelect.addEventListener('change', () => {
            filterSubcategories(subcategorySelect, categorySelect.value);
            displayGallery();
        });

        subcategorySelect.addEventListener('change', displayGallery);

        galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
        galleryContainer.appendChild(categorySelect);
        galleryContainer.appendChild(createLabel('SubCategory:', 'subcategorySelect'));
        galleryContainer.appendChild(subcategorySelect);

        const resetButton = createResetButton(categorySelect, subcategorySelect);
        galleryContainer.appendChild(resetButton);

        filterSubcategories(subcategorySelect, categorySelect.value);
        displayGallery();
    }

    function createDropdown(id, options) {
        const select = document.createElement('select');
        select.id = id;
        select.appendChild(createOption('All'));

        options.forEach(optionValue => {
            if (optionValue) {
                select.appendChild(createOption(optionValue));
            }
        });

        return select;
    }

    function filterSubcategories(subcategorySelect, selectedCategory) {
        subcategorySelect.innerHTML = '';
        subcategorySelect.appendChild(createOption('All'));

        const subcategories = new Set(items.slice(1)
            .filter(item => selectedCategory === 'All' || item[indices['Category']] === selectedCategory)
            .map(item => item[indices['SubCategory']] || '')
        );

        subcategories.forEach(optionValue => {
            if (optionValue) {
                subcategorySelect.appendChild(createOption(optionValue));
            }
        });
    }

function displayGallery() {
    const selectedCategory = document.getElementById('categorySelect').value;
    const selectedSubcategory = document.getElementById('subcategorySelect').value;
    const gallery = document.getElementById('csvGallery');
    gallery.innerHTML = '';
    let itemCount = 0;

    console.log("Selected Category:", selectedCategory);
    console.log("Selected Subcategory:", selectedSubcategory);

    const skuGroups = new Map();
    const defaultImageUrl = 'https://lh3.googleusercontent.com/d/1YkirFIDROJt26ULPsGz0Vcax7YjGrBZa';

    items.slice(1).forEach(item => {
        if (!item || item.length < headers.length) return; // Defensive check

        const sku = item[indices['SKU']] || '';
        const skuVar = item[indices['SKUVAR']] || '';
        const categoryMatch = selectedCategory === 'All' || item[indices['Category']] === selectedCategory;
        const subcategoryMatch = selectedSubcategory === 'All' || item[indices['SubCategory']] === selectedSubcategory;

        console.log("Item SKU:", sku, "Category Match:", categoryMatch, "Subcategory Match:", subcategoryMatch);

        if (categoryMatch && subcategoryMatch) {
            const imageUrl = (item[indices['Thumbnails']] && item[indices['Thumbnails']].trim() !== '')
                ? item[indices['Thumbnails']]
                : defaultImageUrl;

            // Continue building the skuGroups and display cards
        }
    });

    // Log total item count
    console.log("Total items found:", itemCount);
    document.getElementById('itemCount').textContent = ` ${itemCount} Found`;
}


    function createCard(skuName, skuCount, imageUrl, sku, quantityLimit, quantity) {
        const div = document.createElement('div');
        div.classList.add('card');

        div.addEventListener('click', () => {
            const modalImg = document.getElementById("img01");
            const captionText = document.getElementById("caption");

            modal.style.display = "block"; 
            modalImg.src = imageUrl;
            captionText.innerHTML = skuName;

            document.body.classList.add('modal-open');
        });

        const contentDiv = createContentDiv(skuName, skuCount, imageUrl, sku, quantityLimit, quantity);
        div.appendChild(contentDiv);

        return div;
    }

    function createContentDiv(skuName, skuCount, imageUrl, sku, quantityLimit, quantity) {
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        const imageContainer = document.createElement('div');
        const img = createImage(imageUrl);
        imageContainer.appendChild(img);
        contentDiv.appendChild(imageContainer);

        contentDiv.appendChild(createParagraph(skuName, 'title'));

        const availableCountDiv = document.createElement('div');
        availableCountDiv.classList.add('available-count');

        if (quantityLimit) {
            availableCountDiv.innerHTML = `${skuCount} <br>Available`;
        } else if (!quantityLimit && quantity > 0) {
            availableCountDiv.innerHTML = `${quantity} <br>Left`;
        }
        
        contentDiv.appendChild(availableCountDiv);

        const skuDiv = document.createElement('div');
        skuDiv.classList.add('sku');
        skuDiv.innerHTML = sku; 
        contentDiv.appendChild(skuDiv);

        return contentDiv;
    }

    function createImage(src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Thumbnail';
        img.classList.add('thumbnail');
        return img;
    }

    function createParagraph(text, className) {
        const p = document.createElement('p');
        p.textContent = text;
        p.classList.add(className);
        return p;
    }

    function createOption(value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        return option;
    }

    function createLabel(text, htmlFor) {
        const label = document.createElement('label');
        label.textContent = text;
        label.htmlFor = htmlFor;
        return label;
    }

    function createResetButton(categorySelect, subcategorySelect) {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.addEventListener('click', () => {
            categorySelect.value = 'All';
            subcategorySelect.value = 'All';
            filterSubcategories(subcategorySelect, 'All');
            displayGallery();
        });
        return resetButton;
    }

    let timeout = null;
    document.getElementById("myInput").addEventListener('input', liveSearch);

    function liveSearch() {
        clearTimeout(timeout);

        const input = document.getElementById("myInput");
        const filter = input.value.toUpperCase();
        const gallery = document.getElementById('csvGallery');
        const cards = gallery.getElementsByClassName('card');

        let itemCount = 0; 
        Array.from(cards).forEach(card => {
            const title = card.getElementsByClassName("title")[0];
            const sku = card.getElementsByClassName("sku")[0];
            const txtValueTitle = title ? title.textContent || title.innerText : '';
            const txtValueSku = sku ? sku.textContent || sku.innerText : '';

            if (txtValueTitle.toUpperCase().includes(filter) || txtValueSku.toUpperCase().includes(filter)) {
                card.style.display = "";
                itemCount++;
            } else {
                card.style.display = "none";
            }
        });

        document.getElementById('itemCount').textContent = `${itemCount} Found`;

        timeout = setTimeout(() => {
            input.value = '';
        }, 1500);
    }
});
