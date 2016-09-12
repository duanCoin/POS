'use strict';
let {
    formatTags,
    countBarcodes,
    buildCartItems,
    buildPromotedItems,
    calculateTotalPrices,
    buildReceipt,
    printReceipt
} = require('../main/main.js');

let {
    loadAllItems,
    loadPromotions
} = require('./fixtures.js');

describe('pos', () => {

    it('should format the tags', ()=> {
        let tags = ['ITEM0001', 'ITEM0002-3'];
        let formattedTags = formatTags(tags);
        let expected = [
            {barcode: 'ITEM0001', count: 1},
            {barcode: 'ITEM0002', count: 3}
        ];
        expect(formattedTags).toEqual(expected);
    });

    it('countBarcodes', ()=> {
        let formattedTags = [
            {barcode: 'ITEM0001', count: 1},
            {barcode: 'ITEM0002', count: 3},
            {barcode: 'ITEM0001', count: 1}
        ];
        let countedBarcodes = countBarcodes(formattedTags);
        let expected = [
            {barcode: 'ITEM0001', count: 2},
            {barcode: 'ITEM0002', count: 3}
        ];
        expect(countedBarcodes).toEqual(expected);
    });

    it('buildCartItems', ()=> {
        let allItems = loadAllItems();
        let countedBarcodes = [
            {barcode: 'ITEM000000', count: 2},
            {barcode: 'ITEM000001', count: 3}
        ];
        let cartItems = buildCartItems(countedBarcodes, allItems);
        let expected = [
            {barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 2},
            {barcode: 'ITEM000001', name: '羽毛球', unit: '个', price: 1.00, count: 3}
        ];
        expect(cartItems).toEqual(expected);
    });

    it('buildPromotedItems', ()=> {
        let cartItems = [
            {barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 11},
            {barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 10}
        ];
        let promotions = loadPromotions();
        let promotedItems = buildPromotedItems(cartItems, promotions);
        let expected = [
            {
                barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 11,
                payPrice: 31.35, saved: 1.65
            },
            {
                barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 10,
                payPrice: 30, saved: 0
            }
        ];
        expect(promotedItems).toEqual(expected);
    });

    it('calculateTotalPrices', () => {
        let promotedItems = [
            {
                barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 11,
                payPrice: 31.35, saved: 1.65
            },
            {
                barcode: 'ITEM000001', name: '羽毛球', unit: '个', price: 1.00, count: 3,
                payPrice: 3, saved: 0
            }
        ];
        let totalPrices = calculateTotalPrices(promotedItems);
        let expected = {
            totalPayPrice: 34.35,
            totalSaved: 1.65
        };
        expect(totalPrices).toEqual(expected);
    });

    it('buildReceipt without saved', () => {
        let promotedItems = [
            {
                barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 10,
                payPrice: 30, saved: 0
            }
        ];
        let totalPrices = {
            totalPayPrice: 30,
            totalSaved: 0
        };
        let receipt = buildReceipt(promotedItems, totalPrices);
        let expected = {
            promotedItems: [
                {
                    name: '可口可乐', unit: '瓶', price: 3.00, count: 10, payPrice: 30, saved: 0
                }
            ],
            savedItems: [],
            totalPayPrice: 30,
            totalSaved: 0
        };
        expect(receipt).toEqual(expected);
    });

    it('buildReceipt with saved items', () => {
        let promotedItems = [
            {
                barcode: 'ITEM000000', name: '可口可乐', unit: '瓶', price: 3.00, count: 11,
                payPrice: 31.35, saved: 1.65
            }
        ];
        let totalPrices = {
            totalPayPrice: 31.35,
            totalSaved: 1.65
        };
        let receipt = buildReceipt(promotedItems, totalPrices);
        let expected = {
            promotedItems: [
                {
                    name: '可口可乐', unit: '瓶', price: 3.00, count: 11,
                    payPrice: 31.35, saved: 1.65
                }
            ],
            savedItems: [{
                name: '可口可乐',
                count: 11,
                unit: '瓶'
            }],
            totalPayPrice: 31.35,
            totalSaved: 1.65
        };
        expect(receipt).toEqual(expected);
    });

    it('should print text for items has promoted', () => {
        let tags = [
            'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000', 'ITEM000000',
            'ITEM000001', 'ITEM000001', 'ITEM000001', 'ITEM000001', 'ITEM000001',
            'ITEM000002-2'];

        spyOn(console, 'log');

        printReceipt(tags);

        const expectText = `***<没钱赚商店>购物清单***
名称：可口可乐，数量：11瓶，单价：3.00(元)，小计：31.35(元)，优惠：1.65(元)
名称：羽毛球，数量：5个，单价：1.00(元)，小计：5.00(元)
名称：苹果，数量：2斤，单价：5.50(元)，小计：11.00(元)
----------------------
批发价出售商品：
名称：可口可乐，数量：11瓶
----------------------
总计：47.35(元)
节省：1.65(元)
**********************`;

        expect(console.log).toHaveBeenCalledWith(expectText);
    });

    it('should print text for items with no one has promoted', () => {

        let tags = [
            'ITEM000000', 'ITEM000000', 'ITEM000000',
            'ITEM000001', 'ITEM000001', 'ITEM000001', 'ITEM000001', 'ITEM000001',
            'ITEM000002-2'];

        spyOn(console, 'log');

        printReceipt(tags);

        const expectText = `***<没钱赚商店>购物清单***
名称：可口可乐，数量：3瓶，单价：3.00(元)，小计：9.00(元)
名称：羽毛球，数量：5个，单价：1.00(元)，小计：5.00(元)
名称：苹果，数量：2斤，单价：5.50(元)，小计：11.00(元)
----------------------
总计：25.00(元)
**********************`;

        expect(console.log).toHaveBeenCalledWith(expectText);
    });

});
