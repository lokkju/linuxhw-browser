/*
 * Buffer-based entry point for WASM - skips filesystem entirely.
 * JS writes EDID bytes directly to this buffer, then calls parse_edid_run.
 */

// Static input buffer - JS writes here via HEAPU8
static unsigned char edid_input_buffer[EDID_PAGE_SIZE * EDID_MAX_BLOCKS];

// Get pointer to input buffer for JS to write to
extern "C" unsigned char* get_edid_buffer(void)
{
	return edid_input_buffer;
}

// Get max buffer size
extern "C" unsigned int get_edid_buffer_size(void)
{
	return sizeof(edid_input_buffer);
}

// Parse EDID from the input buffer
extern "C" int parse_edid_buffer(unsigned int len)
{
	for (unsigned i = 0; i < EDID_MAX_BLOCKS + 1; i++) {
		s_msgs[i][0].clear();
		s_msgs[i][1].clear();
	}
	options[OptCheck] = 1;
	options[OptPreferredTimings] = 1;
	options[OptNativeResolution] = 1;
	options[OptSkipSHA] = 0;
	options[OptUTF8] = 1;
	state = edid_state();

	// Validate buffer
	if (len < EDID_PAGE_SIZE || len > sizeof(edid_input_buffer)) {
		fprintf(stderr, "Invalid EDID size: %u bytes\n", len);
		return -1;
	}
	if (memcmp(edid_input_buffer, "\x00\xFF\xFF\xFF\xFF\xFF\xFF\x00", 8)) {
		fprintf(stderr, "No EDID header found.\n");
		return -1;
	}

	// Copy from input buffer to edid array
	memcpy(edid, edid_input_buffer, len);
	state.edid_size = len;
	state.num_blocks = len / EDID_PAGE_SIZE;

	return state.parse_edid();
}
