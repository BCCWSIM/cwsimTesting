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
    let titleData = [];
    let titleHeaders, titleIndices = {};

    // Fetch title and logo CSV
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQFs1QTm7qtKV8JLHabFU6vJWNTv-m9OP8M2BkDqX0ooSWqdXALW-UJ2UZAN5NFrY6R_HEH6--SdVa7/pub?output=csv')
        .then(response => response.text())
        .then(csvData => {
            titleData = parseCSV(csvData);
            if (titleData.length > 0) {
                titleHeaders = titleData[0];
                initializeTitleIndices(['Title', 'Logo1', 'Logo2']);
                setTitleAndLogos(titleData[1]); // Use the first row of title data
            } else {
                console.error('No data found in the title CSV.');
            }
        })
        .catch(error => console.error('Error fetching title CSV:', error));

    // Fetch gallery CSV
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vT5qcq-QHtDeJHajLkcTHSwI5JsJndZotORtxyBjt1u1VLqOdLZx94RKdda1c064dUd0TBxRQAeippH/pub?output=csv')
        .then(response => response.text())
        .then(csvData => {
            items = parseCSV(csvData);
            if (items.length > 0) {
                headers = items[0];
                initializeIndices(['SKU', 'SKUVAR', 'SKUName', 'QuantityLimit', 'Quantity', 'Category', 'SubCategory', 'Thumbnails']);
                initializeDropdowns(); // Call to initialize dropdowns and reset button
                displayGallery(); // Display the initial gallery
            } else {
                console.error('No data found in the gallery CSV.');
            }
        })
        .catch(error => console.error('Error fetching gallery CSV:', error));

    function parseCSV(csvData) {
        const rows = csvData.split('\n').filter(row => row.trim().length > 0);
        return rows.map(row => row.split(',').map(cell => cell.trim()));
    }

    function initializeIndices(requiredHeaders) {
        requiredHeaders.forEach(header => {
            indices[header] = headers.indexOf(header);
            if (indices[header] === -1) {
                console.error(`Header ${header} not found. Check your CSV format.`);
            }
        });
    }

    function initializeTitleIndices(requiredHeaders) {
        requiredHeaders.forEach(header => {
            titleIndices[header] = titleHeaders.indexOf(header);
            if (titleIndices[header] === -1) {
                console.error(`Header ${header} not found in title CSV. Check your CSV format.`);
            }
        });
    }

    function setTitleAndLogos(firstRow) {
        document.title = firstRow[titleIndices['Title']] || 'Default Title';
        const logo1Element = document.querySelector('.logo1');
        const logo2Element = document.querySelector('.logo2');
        logo1Element.src = firstRow[titleIndices['Logo1']] || 'default-logo1.png'; 
        logo2Element.src = firstRow[titleIndices['Logo2']] || 'default-logo2.png'; 
    }

    function initializeDropdowns() {
        const categories = new Set(items.slice(1).map(item => item[indices['Category']] || ''));
        const categorySelect = createDropdown('categorySelect', categories);
        const subcategorySelect = createDropdown('subcategorySelect', new Set());

        const searchContainer = document.getElementById('searchAndFilterContainer');
        
        searchContainer.appendChild(createLabel('Category:', 'categorySelect'));
        searchContainer.appendChild(categorySelect);
        searchContainer.appendChild(createLabel('SubCategory:', 'subcategorySelect'));
        searchContainer.appendChild(subcategorySelect);

        const resetButton = createResetButton(categorySelect, subcategorySelect);
        searchContainer.appendChild(resetButton);

        categorySelect.addEventListener('change', () => {
            filterSubcategories(subcategorySelect, categorySelect.value);
            displayGallery();
        });

        subcategorySelect.addEventListener('change', displayGallery);
        filterSubcategories(subcategorySelect, categorySelect.value);
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

        const skuGroups = new Map();
        const defaultImageUrl = 'https://lh3.googleusercontent.com/d/1YkirFIDROJt26ULPsGz0Vcax7YjGrBZa';

        items.slice(1).forEach(item => {
            const sku = item[indices['SKU']] || '';
            const skuVar = item[indices['SKUVAR']] || '';
            const categoryMatch = selectedCategory === 'All' || item[indices['Category']] === selectedCategory;
            const subcategoryMatch = selectedSubcategory === 'All' || item[indices['SubCategory']] === selectedSubcategory;

            if (categoryMatch && subcategoryMatch) {
                const imageUrl = (item[indices['Thumbnails']] && item[indices['Thumbnails']].trim() !== '')
                    ? item[indices['Thumbnails']]
                    : defaultImageUrl;

                const key = `${sku}-${skuVar}`;
                if (!skuGroups.has(key)) {
                    skuGroups.set(key, {
                        count: 1,
                        skuName: item[indices['SKUName']] || 'Unknown SKU',
                        imageUrl,
                        sku
                    });
                } else {
                    skuGroups.get(key).count++;
                }
            }
        });

        skuGroups.forEach(({ count, skuName, imageUrl }) => {
            const div = createCard(skuName, count, imageUrl);
            gallery.appendChild(div);
            itemCount++;
        });

        document.getElementById('itemCount').textContent = `${itemCount} Found`;
    }

    function createCard(skuName, skuCount, imageUrl) {
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

        const contentDiv = createContentDiv(skuName, skuCount, imageUrl);
        div.appendChild(contentDiv);

        return div;
    }

    function createContentDiv(skuName, skuCount, imageUrl) {
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
        availableCountDiv.innerHTML = `${skuCount} <br>Available`;
        contentDiv.appendChild(availableCountDiv);

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
            const txtValueTitle = title ? title.textContent || title.innerText : '';

            if (txtValueTitle.toUpperCase().includes(filter)) {
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
