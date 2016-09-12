'use strict';

let {
    loadAllItems,
    loadPromotions
} = require('./fixtures.js');

const allItems = loadAllItems();

function formatTags(tags) {
    return tags.map((tag) => {
        if (tag.includes('-')) {
            let [barcode, count] = tag.split('-');
            return {barcode, count: parseFloat(count)};
        }
        else
            return {barcode: tag, count: 1};
    });
}

function getExistElementByBarcode(array, barcode) {
    return array.find((item) => item.barcode === barcode);
}

function countBarcodes(formattedTags) {
    return formattedTags.reduce((result, formattedTag) =>{
        let found = getExistElementByBarcode(result, formattedTag.barcode);
        if(found)
            found.count += formattedTag.count;
        else
            result.push(formattedTag);

        return result;
    }, []);
}

function buildCartItems(countedBarcodes, allItems) {
    let cartItems = [];

    for (let countedBarcode of countedBarcodes) {
        let tag = getExistElementByBarcode(allItems, countedBarcode.barcode);
        cartItems.push({
            barcode: tag.barcode,
            name: tag.name,
            count: countedBarcode.count,
            unit: tag.unit,
            price: tag.price
        });
    }

    return cartItems;
}

function buildPromotedItems(cartItems, promotions) {
    let receiptItems = [];

    for (let cartItem of cartItems) {
        let saved = 0;
        let payPrice = 0;
        let findPromotionBarcode = false;

        for (let promotion of promotions)
            if (findPromotionBarcode === false) {
                let tag = promotion.barcodes.find((barcode) => {
                    return barcode === cartItem.barcode
                });
                if (tag !== undefined) {
                    findPromotionBarcode = true;
                    if (promotion.type === 'BUY_TWO_GET_ONE_FREE')
                        saved = cartItem.count / 3 * cartItem.price;
                    else if (promotion.type === '单品批发价出售')
                        if (cartItem.count > 10)
                            saved = parseFloat((cartItem.count * cartItem.price * 0.05).toFixed(2));
                        else
                            ;
                }
            }

        payPrice = parseFloat((cartItem.count * cartItem.price - saved).toFixed(2));
        receiptItems.push({
            barcode: cartItem.barcode,
            name: cartItem.name,
            count: cartItem.count,
            unit: cartItem.unit,
            price: cartItem.price,
            saved: saved,
            payPrice: payPrice,
        });
        findPromotionBarcode = false;
    }

    return receiptItems;
}

function calculateTotalPrices(promotedItems) {
    let totalPayPrice = 0;
    let totalSaved = 0;

    for (let promotedItem of promotedItems) {
        totalPayPrice += promotedItem.payPrice;
        totalSaved += promotedItem.saved;
    }

    return {
        totalPayPrice: totalPayPrice,
        totalSaved: totalSaved
    }
}

function buildReceipt(promotedItems, {totalPayPrice, totalSaved}) {
    let savedItems = promotedItems.filter((promotedItem) => promotedItem.saved > 0).map(({name, count, unit}) =>{
        return {name, count, unit}
    });

    return {
        promotedItems: promotedItems.map(({name, unit, price, count, payPrice, saved}) => {
            return {name, unit, price, count, payPrice, saved}
        }),
        savedItems,
        totalPayPrice,
        totalSaved
    };
}

function buildReceiptString(receipts) {
    let lines = ['***<没钱赚商店>购物清单***'];

    for(let {name, count, unit, price, payPrice,saved} of receipts.promotedItems){
        let line = `名称：${name}，数量：${count}${unit}，单价：${(price).toFixed(2)}(元)，小计：${(payPrice).toFixed(2)}(元)`;
        if(saved > 0)
            line += `，优惠：${(saved).toFixed(2)}(元)`
        lines.push(line);
    }

    let hasSaved = receipts.savedItems.length > 0;
    if(hasSaved){
        lines.push('----------------------');
        lines.push('批发价出售商品：');

        for(let {name, count, unit} of receipts.savedItems)
            lines.push(`名称：${name}，数量：${count}${unit}`);
    }
    lines.push(`----------------------`);
    lines.push(`总计：${(receipts.totalPayPrice).toFixed(2)}(元)`);
    if(hasSaved)
        lines.push(`节省：${(receipts.totalSaved).toFixed(2)}(元)`);
    lines.push(`**********************`);

    let receiptString = lines.join('\n');
    console.log(receiptString);
}

function printReceipt(tags) {
    let formattedTags = formatTags(tags);
    let countedBarcodes = countBarcodes(formattedTags);
    let cartItems = buildCartItems(countedBarcodes, allItems);
    let promotions = loadPromotions();
    let promotedItems = buildPromotedItems(cartItems, promotions);
    let totalPrices = calculateTotalPrices(promotedItems);
    let receipts = buildReceipt(promotedItems, totalPrices);
    let result = buildReceiptString(receipts);

    console.log(result);
}

module.exports = {
    formatTags,
    countBarcodes,
    buildCartItems,
    buildPromotedItems,
    calculateTotalPrices,
    buildReceipt,
    printReceipt
};


