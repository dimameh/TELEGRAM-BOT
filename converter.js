class Converter{

    constructor(){
        RuToSom = 167;
    }

    GetExchangeRate()
    {
        return RuToSom;
    }

    SetExchangeRate(rate)
    {
        RuToSom = rate;
    }

    Convert(SomValue){
        return (SomValue * RuToSom).toFixed(2);
    }
}

let RuToSom;

module.exports = new Converter()