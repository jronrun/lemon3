/**
 *
 */
var isFileSaverSupported = false; try {
  isFileSaverSupported = !!new Blob;
} catch (e) {/**/}

if (isFileSaverSupported) {
  require('file-saver');
}
require('filereader/filereader');


// module.exports
