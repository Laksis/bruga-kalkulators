document.addEventListener('DOMContentLoaded', () => { 
  updateHeights();
  updatePavingOptions();
  updateTransportOptions();

  document.getElementById('manufacturer').addEventListener('change', updateTransportOptions);
  document.getElementById('returnPalettes').addEventListener('change', function() {
    document.getElementById('returnOptions').style.display = this.checked ? 'block' : 'none';
  });

  document.getElementById('paving').addEventListener('change', updateColorOptions);
});

const pavingData = {
  brikers: {
    heights: ["60", "70", "80", "100", "120"],
    paletteCost: 10,
    transportOptions: {
      truck: { name: "Fūre (24t)", minPrice: 120, costPerKm: 1.2, maxLoad: 24000 },
      crane: { name: "Manipulātors bez piekabes (12t)", minPrice: 120, costPerKm: 1.5, maxLoad: 12000 },
      crane_trailer: { name: "Manipulātors ar piekabi (23t)", minPrice: 150, costPerKm: 1.8, maxLoad: 23000 }
    },
    returnTransport: {
      truck: { minPrice: 120, costPerKm: 1.4, capacity: 520 },
      crane: { minPrice: 120, costPerKm: 1.1, capacity: 210 },
      bus: { minPrice: 90, costPerKm: 0.85, capacity: 22 }
    },
    products: {
      "60": [
        { name: "PRIZMA 6 CLASSIC", price: { Grey: 8.6, Red_Brown: 9.55 }, paletteArea: 11.88, paletteWeight: 1600 }
      ]
    }
  },
  betono_mozaika: {
    heights: ["60"],
    paletteCost: 12,
    transportOptions: {
      truck: { name: "Fūre (22t)", minPrice: 130, costPerKm: 1.3, maxLoad: 22000 },
      crane: { name: "Manipulātors bez piekabes (18t)", minPrice: 140, costPerKm: 1.6, maxLoad: 18000 },
      crane_trailer: { name: "Manipulātors ar piekabi (28t)", minPrice: 160, costPerKm: 1.9, maxLoad: 28000 }
    },
    returnTransport: {
      truck: { minPrice: 60, costPerKm: 0.9, capacity: 520 },
      crane: { minPrice: 70, costPerKm: 1.1, capacity: 210 },
      bus: { minPrice: 40, costPerKm: 0.6, capacity: 22 }
    },
    products: {
      "60": [
        { name: "PRIZMA 6 ar fāzi", price: { Pelēks: 10, single_color: 11 }, paletteArea: 8.64, paletteWeight: 1598 }
      ]
    }
  }
};

function updateHeights() {
  const manufacturer = document.getElementById('manufacturer').value;
  const heightSelect = document.getElementById('height');
  const heights = pavingData[manufacturer]?.heights || [];

  heightSelect.innerHTML = '';
  heights.forEach(height => {
    const option = document.createElement('option');
    option.value = height;
    option.textContent = `${height} mm`;
    heightSelect.appendChild(option);
  });

  updatePavingOptions();
}

function updatePavingOptions() {
  const manufacturer = document.getElementById('manufacturer').value;
  const height = document.getElementById('height').value;
  const pavingSelect = document.getElementById('paving');
  const products = pavingData[manufacturer]?.products[height] || [];

  pavingSelect.innerHTML = '';
  if (products.length > 0) {
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.name;
      option.textContent = product.name;
      pavingSelect.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nav pieejamu produktu';
    pavingSelect.appendChild(option);
  }

  updateColorOptions();
}

function updateColorOptions() {
  const manufacturer = document.getElementById('manufacturer').value;
  const height = document.getElementById('height').value;
  const pavingName = document.getElementById('paving').value;
  const colorSelect = document.getElementById('color');

  const products = pavingData[manufacturer]?.products[height] || [];
  const paving = products.find(p => p.name === pavingName);

  colorSelect.innerHTML = '';

  if (paving) {
    Object.entries(paving.price).forEach(([color, price]) => {
      if (price !== null) {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color.replace(/_/g, ' ');
        colorSelect.appendChild(option);
      }
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nav pieejamu krāsu';
    colorSelect.appendChild(option);
  }
}

function updateTransportOptions() {
  const manufacturer = document.getElementById('manufacturer').value;
  const deliverySelect = document.getElementById('delivery');
  const transportOptions = pavingData[manufacturer]?.transportOptions || {};

  deliverySelect.innerHTML = '';

  Object.entries(transportOptions).forEach(([key, option]) => {
    const transportOption = document.createElement('option');
    transportOption.value = key;
    transportOption.textContent = option.name;
    deliverySelect.appendChild(transportOption);
  });
}

function calculate() {
  const manufacturer = document.getElementById('manufacturer').value;
  const height = document.getElementById('height').value;
  const pavingName = document.getElementById('paving').value;
  const color = document.getElementById('color').value;
  const area = parseFloat(document.getElementById('area').value);
  const cuttingPercent = parseFloat(document.getElementById('cutting').value) || 0;
  const distance = parseFloat(document.getElementById('distance').value);
  const deliveryType = document.getElementById('delivery').value;
  const returnPalettes = document.getElementById('returnPalettes').checked;
  const returnType = document.getElementById('returnType')?.value || '';
  const brokenPercent = parseFloat(document.getElementById('broken').value) || 0;

  // Validācijas pārbaude
  if (!manufacturer || !height || !pavingName || !color || isNaN(area) || area <= 0 || isNaN(distance) || distance <= 0) {
    document.getElementById('result').innerHTML = '<p>Kļūda: Lūdzu ievadiet derīgus datus visos laukos!</p>';
    return;
  }

  // Izvēlētais produkts
  const products = pavingData[manufacturer]?.products[height] || [];
  const paving = products.find(p => p.name === pavingName);

  if (!paving) {
    alert('Nav atrasts izvēlētais bruģis. Lūdzu, pārbaudiet savas izvēles.');
    return;
  }

  // Transporta iespējas
  const transportOption = pavingData[manufacturer]?.transportOptions[deliveryType];
  if (!transportOption) {
    document.getElementById('result').innerHTML = '<p>Kļūda: Izvēlētais transporta veids nav pieejams.</p>';
    return;
  }

  // Kvadratūras aprēķins ar piezāģēm
  const totalAreaRaw = area + (area * cuttingPercent / 100); // Ieskaitot piezāģes
  const palettesNeeded = Math.ceil(totalAreaRaw / paving.paletteArea); // Noapaļojot uz augšu
  const totalArea = palettesNeeded * paving.paletteArea; // Pielāgota kvadratūra atbilstoši paletēm
  const totalWeight = palettesNeeded * paving.paletteWeight;

  // Piegādes aprēķins
  const trips = Math.ceil(totalWeight / transportOption.maxLoad);
  let deliveryCost = Math.max(trips * distance * transportOption.costPerKm, transportOption.minPrice);

  // Bruģa izmaksas
  const pavingCost = totalArea * paving.price[color];

  // Paletes izmaksas
  const paletteCost = pavingData[manufacturer]?.paletteCost || 10;
  const paletteCostTotal = palettesNeeded * paletteCost;

  // Atgriešanas izmaksas
  let returnCost = 0;
  let returnRevenue = 0;
  let netReturnProfit = 0;

  if (returnPalettes) {
    const returnTransportOption = pavingData[manufacturer]?.returnTransport[returnType];
    if (!returnTransportOption) {
      document.getElementById('result').innerHTML = '<p>Kļūda: Izvēlētais atgriešanas transporta veids nav pieejams.</p>';
      return;
    }

    const brokenPalettes = Math.ceil(palettesNeeded * (brokenPercent / 100)); // Sabojātās paletes
    const acceptedPalettes = palettesNeeded - brokenPalettes; // Pieņemtās paletes
    const returnTrips = Math.ceil(acceptedPalettes / returnTransportOption.capacity); // Braucieni
    const totalReturnDistance = distance * 2; // Abos virzienos
    returnCost = Math.max(returnTrips * totalReturnDistance * returnTransportOption.costPerKm, returnTransportOption.minPrice);
    returnRevenue = acceptedPalettes * paletteCost; // Ienākumi no atgrieztām paletēm
    netReturnProfit = returnRevenue - returnCost; // Tīrā peļņa
  }

  // Kopējās izmaksas
  const totalCost = pavingCost + deliveryCost + paletteCostTotal - netReturnProfit;
  const costPerSquareMeter = totalCost / area;

  // Rezultātu izvadīšana
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = `
    <p>Kopējā bruģa kvadratūra (ar piezāģēm): <span>${totalArea.toFixed(2)} m²</span></p>
    <p>Bruģa cena: <span>${pavingCost.toFixed(2)} EUR</span></p>
    <p>Paletu skaits: <span>${palettesNeeded}</span></p>
    <p>Paletes izmaksas: <span>${paletteCostTotal.toFixed(2)} EUR</span></p>
    <p>Piegādes cena: <span>${deliveryCost.toFixed(2)} EUR</span></p>
    ${returnPalettes ? `
      <p>Atgriežamo palešu skaits: <span>${palettesNeeded - Math.ceil(palettesNeeded * (brokenPercent / 100))}</span></p>
      <p>Atgriešanas izmaksas: <span>${returnCost.toFixed(2)} EUR</span></p>
      <p>Atgriešanas ieņēmumi: <span>${returnRevenue.toFixed(2)} EUR</span></p>
      <p>Atgriešanas tīrā peļņa: <span>${netReturnProfit.toFixed(2)} EUR</span></p>
    ` : ''}
    <p>Cena par 1 m² (bruģis, paliknis, transports${returnPalettes ? ', atgrieztas paletes' : ''}): <span>${costPerSquareMeter.toFixed(2)} EUR/m²</span></p>
  `;
}

