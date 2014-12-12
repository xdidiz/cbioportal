var mutationSignature = (function() {
	var transitions = ['CA', 'CG', 'CT', 'TA', 'TC', 'TG'];
	var comp = {'A':'T', 'C':'G', 'G':'C', 'T':'A'};
	var getStrattonOrderedContexts = function() {
		var ret = [];
		var nuc = ['A','C','G','T'];
		for (var t=0; t<transitions.length; t++) {
			for (var n1=0; n1<nuc.length; n1++) {
				for (var n2=0; n2<nuc.length; n2++) {
					ret.push(nuc[n1] + transitions[t] + nuc[n2]);
				}
			}
		}
		return ret;
	};
	var canonicalForm = function(SNPobj) {
		var transition = SNPObj.ref+SNPObj.variant;
		if (transition in transitions) {
			return SNPobj.left+transition+SNPobj.right;
		} else {
			return comp[SNPObj.right]+comp[SNPObj.ref]+comp[SNPObj.variant]+comp[SNPObj.left];
		}
	};
	var loadTrinucleotideContextsAndMakeDiagram = function(div, mutations) {
		// in: a list of {chr:.., start:.., end:.., ref:.., variant:..}
		// makes a mutation signature graph
		//load the data
		var labels = getStrattonOrderedContexts();
		var counts = [];
		for (var i=0; i<labels.length; i++) {
			counts.push(0);
		}
		// first load all the trinucleotide contexts
		var toLoad = mutations.length;
		var SNPType = [];
		while (toLoad > 0) {
			var mutation = mutations[toLoad-1];
			if (mutation.start !== mutation.end) {
				// only SNPs
				toLoad -= 1;
				if (toLoad === 0) {
					// process SNPType
					makeMutationSignatureDiagram(div, SNPType, labels);
				}
				continue;
			}
			var chr = mutations[toLoad].chr;
			if (chr === 23) {
				chr = 'X';
			} else if (chr === 24) {
				chr = 'Y';
			}
			var endpt = 'http://genome.ucsc.edu/cgi-bin/das/hg19/dna?segment=chr'+chr+':'+(mutations[toLoad].start-1)+','+(mutations[toLoad].start+1);
			(function(mut) { 
				$.get(endpt, function(data) {
					var seq = $(data).find('DNA').html().trim();
					SNPType.push(canonicalForm({left: seq[0], right: seq[1], ref: mut.ref, variant: mut.variant}));
					toLoad -= 1;
					if (toLoad === 0) {
						// process SNPType
						makeMutationSignatureDiagram(div, SNPType, labels);
					}
				});
			})(mutation);
		}

		div.append(makeMutationSignatureDiagram(data, labels));
	}
	var makeMutationSignatureDiagram = function(div, data, labels) {
	};
	return {
		makeDiagram: mutationSignature,
	};
})();