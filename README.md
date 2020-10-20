# Introduction

This is a vowel synthesizer based on a simple tube model for the vocal tract. It features customizable settings for the number of tubes, the length and radius of each tube, the frequency and the closure period of vocal folds' vibration. [Try it here](https://zhanaofu.github.io/tubemodel/).

The glottal source is generated with a polynomial model from Rosenberg (1971). It is assumed that the tubes are loseless, and no air is going back through the mouth or the glottis. The transfer function of the filter is calculated with the [Algebrite](http://algebrite.org) library. The FFT transforms are done with the [DSP.js](https://github.com/corbanbrook/dsp.js/) library. The color scale for the spectrograms are generated with the [chroma.js](https://vis4.net/chromajs/) library.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## References

* Rosenberg, A. E. (1971). Effect of glottal pulse shape on the quality of natural vowels. *The Journal of the Acoustical Society of America, 49*(2B), 583-590.
* Taylor, P. (2009). *Text-to-speech synthesis*. Cambridge University Press.


## License
[MIT](https://choosealicense.com/licenses/mit/)
