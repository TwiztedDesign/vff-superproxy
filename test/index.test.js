import SuperProxy from '../src/index';

let data;
describe("Super Proxy",() => {

    beforeEach(() => {

        data = {
            level1String                : "string1",
            level1Boolean               : true,
            level1Number                : 1,
            level1NumberArray           : [1, 2, 3],
            level1StringArray           : ["a", "b", "c"],
            level1Object                : {
                level2String            : "string2",
                level2Boolean           : true,
                level2Number            : 2,
                level2NumberArray       : [4, 5, 6, 7],
                level2StringArray       : ["d", "e", "f", "g"],
                level2Object            : {
                    level3String        : "string3",
                    level3Boolean       : true,
                    level3Number        : 3,
                    level3NumberArray   : [8, 9, 10],
                    level3StringArray   : ["h", "i"],
                    level3Object        : {
                        level4String    : "string4"
                    }
                }
            }
        };
    });

    it('', () => {
        let sp = new SuperProxy(data, {
            set : function (target, path, value) {
                // console.log(target, path, value);
            }
        });

        expect(sp.level1Boolean).toBeTruthy();
        expect(sp.level1Object.level2Boolean).toBeTruthy();
        expect(sp.level1Object.level2Object.level3Boolean).toBeTruthy();

        sp.level1Object.level2Object.level3Boolean = false;
        let data1 = sp.__self__.level1Object;

        expect(sp.level1Object.level2Object.level3Boolean).toBeFalsy();

    });

    it('', () => { });
    it('', () => { });
    it('', () => { });
    it('', () => { });
    it('', () => { });
    it('', () => { });
    it('', () => { });
    it('', () => { });
});