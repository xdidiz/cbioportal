// Library for OQL
oql = (function() {
    function getGeneList(query) {
        // isolate gene ids from query
        var splitq = query.split(/[\n;]/);
        var lines = [];
        for (var i in splitq) {
            if ($.trim(splitq[i]) !== "") {
                lines.push(splitq[i]);
            }
        }
        var genes = [];
        for (var i in lines) {
            var gene = $.trim(lines[i].split(/[:]/)[0]);
            if (gene!=="") {
                genes.push(gene);
            }
        }
        return genes;       
    }

    
    // You probably want to call filter(parseQuery(query), samples)
    
    /* PARSING */
    // main method is parseQuery(query)
    function sanitizeQuery(query) {
            // IN: text query, as from user
            // OUT: "sanitized", i.e. with a few adjustments made to put
            //		into valid OQL
            // These adjustments are: - capitalize everything except case-sensitive strings like mutation names (TODO)
            //						  - insert defaults from cbioportal interface (TODO)
            var ret = query;
            //ret = ret.toUpperCase();
            return ret;
    }

    function parseQuery(query) {
            // IN: Multiline user-input OQL query
            // OUT: If success, list of javascript objects, one per line of query
            //		If failure, list of maps containing the line numbers and error messages
            var lines = sanitizeQuery(query).split(/[\n;]/);
            var ret = [];
            var errors = [];
            for (var i=0; i<lines.length; i++) {
                    var line = lines[i];
                    if (line.length == 0) {
                            continue;
                    }
                    try {
                            ret.push(oqlParser.parse(line));
                    } catch(err) {
                            errors.push({"line":i, "msg":err});
                    }
            }
            if (errors.length > 0) {
                    return {"result":1, "return":errors};
            }
            return {"result":0, "return":ret};
    }
    
    /* FILTERING */
    // main method is filter(query, samples)
    function mutationMatch(test, targets) {
	// IN: test, a mutation id or type, as given in OQL
	//	   targets, a list of mutation ids as given in the data
	// OUT: whether there is some 'target' which matches 'test'
	// test is either {"type":"class", "value":"MISSENSE"} etc,
	//			or 	   {"type":"name", "value":"V600E"} etc
	// each target is {"name":V600E, "class":MISSENSE} etc

	if(test.type == "class") {
		//TODO: get mutation type info to make this work
		for (var i=0; i<targets.length; i++) {
			if (targets[i].class == test.value) {
				return true;
			}
		}
		return false;
	} else {
		// TODO: how to match mutations by position, not specific name
		for (var i=0; i<targets.length; i++) {
			if (targets[i].name == test.value) {
				return true;
			}
		}
		return false;
	}
    }  

    function reduceFilterTree(tree) {
            // IN: A tree with boolean values at the leaves
            //		and logical operators at the nodes.
            //		In particular, where T is a subtree and B is a 
            //		boolean literal value, a leaf looks like 
            //		{"type":"LEAF", "value":B}, and a node looks like 
            //		one of the following three:
            //		• {"type":"NOT", "child":T}
            //		• {"type":"AND", "left":T1, "right":T2}
            //		• {"type":"OR", "left":T1, "right":T2}
            // OUT: The boolean value the tree reduces to
            // Recursive
            if (tree.type == "LEAF") {
                    return tree.value;
            } else {
                    if (tree.type == "NOT") {
                            return !reduceFilterTree(tree.child);
                    } else if (tree.type == "AND") {
                            return reduceFilterTree(tree.left)&&reduceFilterTree(tree.right);
                    } else if (tree.type == "OR") {
                            return reduceFilterTree(tree.left)||reduceFilterTree(tree.right);
                    }
            }
    }

    function createFilterTree(cmds, gene_attrs) {
            // IN: a query's command tree, a sample's gene attributes
            // OUT: a tree as described in 'reduceBooleanTree'
            //		in which each command is converted to the boolean
            //		value representing whether the given gene attributes complies with it
            if (cmds.type == "AND" || cmds.type == "OR") {
                    return {"type":cmds.type, "left":createFilterTree(cmds["left"], gene_attrs), "right":createFilterTree(cmds["right"], gene_attrs)};
            } else if (cmds.type == "NOT") {
                    return {"type":"NOT", "child":createFilterTree(cmds["child"], gene_attrs)};
            } else {
                    // non-logical type
                    var ret = false;
                    if (cmds.type == "AMP" || cmds.type == "HOMDEL" || cmds.type == "GAIN" || cmds.type == "HETLOSS") {
                            ret = gene_attrs[cmds.type] == 1;
                    } else if (cmds.type == "EXP" || cmds.type == "PROT") {
                            if (cmds.constrType == "<") {
                                    ret = (gene_attrs[cmds.type] != false) && (gene_attrs[cmds.type] < cmds.constrVal);
                            } else if (cmds.constrType == "<=") {
                                    ret = (gene_attrs[cmds.type] != false) && (gene_attrs[cmds.type] <= cmds.constrVal);
                            } else if (cmds.constrType == ">") {
                                    ret = (gene_attrs[cmds.type] != false) && (gene_attrs[cmds.type] > cmds.constrVal);
                            } else if (cmds.constrType == ">=") {
                                    ret = (gene_attrs[cmds.type] != false) && (gene_attrs[cmds.type] >= cmds.constrVal);
                            }
                    } else if (cmds.type == "MUT") {
                            if (cmds.constrType == "=") {
                                    ret = mutationMatch(cmds.constrVal, gene_attrs["MUT"]);
                            } else if (cmds.constrType == "!=") {
                                    ret = !mutationMatch(cmds.constrVal, gene_attrs["MUT"]);
                            } else if (cmds.constrType == false) {
                                    // match any mutation
                                    ret = (gene_attrs["MUT"].length > 0);
                            }
                    }
                    return {"type":"LEAF", "value":ret};
            }
    }


    function filterSample(single_query, sample) {
            // IN: one-line query, one sample
            // OUT: whether 'sample' passes the one-line query 'single_query'
            // Strategy: Convert the query tree into a boolean-valued tree,
            //			then reduce the tree into a single boolean value, the result.
            if (!(single_query.gene in sample)) {
                    // no records on this gene, return false by default
                    return false;
            }
            var filterTree = createFilterTree(single_query.cmds, sample[single_query.gene]);
            /* console.log("FILTER TREE:");
            console.log(filterTree);*/
            return reduceFilterTree(filterTree);
    }


    function filter(query, samples) {
            // IN: Javascript object representing an OQL query, a list of samples
            // OUT: The names of samples in 'samples' for which at least one
            //		line of query returns true
            var ret = [];
            for (var s in samples) {
                    var matchesOne = false;
                    for (var j = 0; j<query.length; j++) {
                            if (filterSample(query[j], samples[s])) {
                                    matchesOne = true;
                                    break;
                            }
                    }
                    if (matchesOne) {
                            ret.push(s);
                    }
            }
            return ret;
    }
    return { getGeneList:getGeneList, parseQuery:parseQuery, filter:filter};
})();