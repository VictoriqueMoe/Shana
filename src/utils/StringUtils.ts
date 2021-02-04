export module StringUtils{
    export function splitCommandLine( commandLine ): string[] {
        let spaceMarker = '<SP>' ;
        while( commandLine.indexOf( spaceMarker ) > -1 ) spaceMarker += '@' ;
        let noSpacesInQuotes = commandLine.replace( /"([^"]*)"?/g, ( fullMatch, capture ) => {
            return capture.replace( / /g, spaceMarker ) ;
        }) ;
        let mangledParamArray = noSpacesInQuotes.split( / +/ ) ;
        let paramArray = mangledParamArray.map( ( mangledParam ) => {
            return mangledParam.replace( RegExp( spaceMarker, 'g' ), ' ' ) ;
        });
        paramArray.shift();
        return paramArray
    }
}