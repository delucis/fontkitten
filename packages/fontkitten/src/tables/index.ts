// Required Tables
import cmap from './cmap';
import head from './head';
import hhea from './hhea';
import hmtx from './hmtx';
import maxp from './maxp';
import name from './name';
import OS2 from './OS2';
import post from './post';

// TrueType Outlines
// import cvt from './cvt';
// import fpgm from './fpgm';
import loca from './loca';
// import prep from './prep';
import glyf from './glyf';

// PostScript Outlines
import CFFFont from '../cff/CFFFont';
// import VORG from './VORG';

// Bitmap Glyphs
// import EBLC from './EBLC';
import sbix from './sbix';
import COLR from './COLR';
import CPAL from './CPAL';

// Advanced OpenType Tables
// import BASE from './BASE';
// import GDEF from './GDEF';
// import GPOS from './GPOS';
import GSUB from './GSUB';
// import JSTF from './JSTF';

// OpenType variations tables
import HVAR from './HVAR';

// Other OpenType Tables
// import DSIG from './DSIG';
// import gasp from './gasp';
// import hdmx from './hdmx';
// import kern from './kern';
// import LTSH from './LTSH';
// import PCLT from './PCLT';
// import VDMX from './VDMX';
import vhea from './vhea';
import vmtx from './vmtx';

// Apple Advanced Typography Tables
import avar from './avar';
// import bsln from './bsln';
// import feat from './feat';
import fvar from './fvar';
import gvar from './gvar';
// import just from './just';
// import morx from './morx';
// import opbd from './opbd';

const tables: Record<string, any> = {
	cmap,
	head,
	hhea,
	hmtx,
	maxp,
	name,
	'OS/2': OS2,
	post,
	// 'cvt ': cvt,
	// fpgm,
	loca,
	// prep,
	glyf,
	'CFF ': CFFFont,
	CFF2: CFFFont,
	// VORG,
	// EBLC,
	// CBLC: EBLC,
	sbix,
	COLR,
	CPAL,
	// BASE,
	// GDEF,
	// GPOS,
	GSUB,
	// JSTF,
	HVAR,
	// DSIG,
	// gasp,
	// hdmx,
	// kern,
	// LTSH,
	// PCLT,
	// VDMX,
	vhea,
	vmtx,
	avar,
	// bsln,
	// feat,
	fvar,
	gvar,
	// just,
	// morx,
	// opbd,
};
export default tables;
