/*
 * Copyright (c) 2016 The Hyve B.V.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * @author Sander Tan
*/

package org.mskcc.cbio.portal.scripts;

import java.io.*;
import java.util.*;
import joptsimple.*;
import org.mskcc.cbio.portal.dao.*;
import org.mskcc.cbio.portal.util.ProgressMonitor;
import org.yaml.snakeyaml.Yaml;
import org.cbioportal.model.GeneSet;
import org.cbioportal.model.GeneSetHierarchy;

public class ImportGeneSetHierarchy extends ConsoleRunnable {
	
	private static Map<Integer, String> savedGeneSets;
	private static List<List<String>> familyNodes;
	private static int nodeIds;
	
	// Initiate a database instance
	static DaoGeneSetHierarchy daoGeneSetHierarchy = DaoGeneSetHierarchy.getInstance();

    @Override
    public void run() {
        try {
            String progName = "ImportGeneSetHierarchy";
            String description = "Import geneset hierarchy files in YAML format.";
            // usage: --data <data_file.yaml> --overwrite
            
            OptionParser parser = new OptionParser();
            OptionSpec<String> data = parser.accepts("data", "Geneset data file")
                    .withRequiredArg().ofType(String.class);
            parser.accepts("overwrite", "Permits overwrite to geneset tree data even if geneset tree is in use");

            OptionSet options = null;
            try {
                options = parser.parse(args);
            }
            catch (Exception ex) {
                throw new UsageException(
                        progName, description, parser, 
                        ex.getMessage());
            }
            
            // if neither option was set then throw UsageException
            if (!options.has(data)) {
                throw new UsageException(
                        progName, description, parser,
                        "'data' argument required");
            }
            
            boolean allowOverwrite = options.has("overwrite");
            
            File genesetFile = new File(options.valueOf(data));
            
        	System.out.println("Input file:");
            System.out.println(genesetFile);
        	System.out.println();
        	
            // First we want to validate that what we can import without errors
            boolean validate = true;
            importData(genesetFile, allowOverwrite, validate);
            
            // If this is succesful, we want to import
            validate = false;
            importData(genesetFile, allowOverwrite, validate);
        }
        catch (Exception ex) {
            ex.printStackTrace();
        }
    }
    
    /**
     * Imports data from geneset hierarchy file.
     */
    private static void importData(File genesetFile, boolean allowOverwrite, boolean validate) throws Exception {
    	
        // Initiate gene set map, parent-child list and node ID counter
    	savedGeneSets = new HashMap<Integer, String>();
    	familyNodes = new ArrayList<List<String>>();
    	nodeIds = 0;
    	
        // Load data and parse with snakeyaml
        InputStream input = new FileInputStream(genesetFile);
        Yaml yaml = new Yaml();
        Map<String, Object> geneSetTree = (Map<String, Object>) yaml.load(input);
    	input.close();

    	// Check if database already contains values
    	boolean emptyDatabase = daoGeneSetHierarchy.checkGeneSetHierarchy();

    	if (validate) {
	    	// Check if geneset_hierarchy already filled
	        if (emptyDatabase) {
	        	System.out.println("Table geneset_hierarchy is empty");
	        } else {
	        	System.out.println("Table geneset_hierarchy is not empty");
	        	System.out.println();
	        }
    	}
	        
    	// Start making changes to database
    	if (emptyDatabase || allowOverwrite) {
        	
    		// Make the database empty
    		if (!emptyDatabase && validate) {
    	    	System.out.println("Emptying geneset_hierarchy and geneset_hierarchy_leaf before filling with new data.");
    	    	System.out.println("");
    			daoGeneSetHierarchy.deleteAllGeneSetHierarchyRecords();
    		}

        	// Parse the tree and import to geneset_hierarchy
        	parseTree(geneSetTree, nodeIds, validate);

            // Report what's loaded
        	if (!validate) {
        		reportGeneSetHierarchy();
        	}
        	
        	// Retrieve geneset ids and save to geneset_hierarchy_leaf
        	addGeneSetHierarchyLeafs(validate);
        
    	} else {
            throw new RuntimeException("\nTable geneset_hierarchy is not empty. Will not overwrite.\n" +
                "Set option '--overwrite' to overwrite existing gene set tree.");
    	}
    }
    
    /**
     * Parses data from geneset hierarchy file and saves in database.
     */
    private static void parseTree(Map<String, Object> geneSetTree, int parentNodeId, boolean validate) {

    	// Create set with child nodes
		Set<String> childNodes = geneSetTree.keySet();
		
		// Iterate over the child nodes at this level
		for (String childNode: childNodes) {
			
			// For each node, increment node ID
			nodeIds ++;
			int childNodeId = nodeIds;
			
			// Add node ID, node name and parent node ID
			// This is for the purpose of testing and reporting
			ArrayList<String> family = new ArrayList<String>();
			family.add(Integer.toString(childNodeId));
			family.add(childNode);
			family.add(Integer.toString(parentNodeId));
			familyNodes.add(family);
			
			// Create new GeneSetHierarchy entry
			GeneSetHierarchy geneSetHierarchy = new GeneSetHierarchy();
			geneSetHierarchy.setNodeId(childNodeId);
			geneSetHierarchy.setNodeName(childNode);
			geneSetHierarchy.setParentId(parentNodeId);

			// Add GeneSetHierarchy to the database
			try {
				if (!validate) {
					daoGeneSetHierarchy.addGeneSetHierarchy(geneSetHierarchy);
				}
			} catch (DaoException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

			// If not the end of a branch, go into the next level
			if (!geneSetTree.get(childNode).equals("gs")) {
				parseTree((Map<String, Object>) geneSetTree.get(childNode), childNodeId, validate);
			
			// If at the end of a branch, save the geneset to list of genesets.
			} else {
				savedGeneSets.put(childNodeId, childNode);
			}
        }
    }

    /**
     * Report what's loaded.
     */
    private static void reportGeneSetHierarchy() {
    	
    	// Print geneset_hierarchy table
    	System.out.println("Gene Hierarchy:");
        for (List family: familyNodes) {
        	System.out.println(family);
        }
    	System.out.println();
  
        // Print all genesets (do not have to be unique)
    	System.out.println("Unique Gene Sets:");
    	for (int geneSetNodeId: savedGeneSets.keySet()) {
    		System.out.println(geneSetNodeId + ": " + savedGeneSets.get(geneSetNodeId));
    	}
    	System.out.println();
    }
    
    
    /**
     * Retrieve gene set IDs.
     */
    private static void addGeneSetHierarchyLeafs(boolean validate) throws DaoException {
        DaoGeneSet daoGeneSet = DaoGeneSet.getInstance();

    	for (int geneSetNodeId: savedGeneSets.keySet()) {
    		String geneSetName = savedGeneSets.get(geneSetNodeId);
    		GeneSet geneSet = daoGeneSet.getGeneSetByExternalId(geneSetName);
    		if (geneSet != null) {  
	    		
	    		// I decided here to not make GeneSetHierarchyLeaf.java and DoaGeneSetHierarchyLeaf.java classes to fill geneset_hierarchy_leaf
	    		// This table is only be a combination of 2 others:
	    		// - geneset
	    		// - geneset_hierarchy
	    		// Necessary code can be added to GeneSetHierarchy.java and DoaGeneSetHierarchy.java
	    		
	    		// Add leaf to geneset_hierarchy_leaf
				if (!validate) {
					daoGeneSetHierarchy.addGeneSetHierarchyLeaf(geneSetNodeId, geneSet.getId());
				}
    		} else {
                throw new RuntimeException("\nGene set `" + geneSetName + "` not in geneset table in database. Please add it first before adding tree containing it.");
    		}
    	}
    }


    public ImportGeneSetHierarchy(String[] args) {
        super(args);
    }
    
    public static void main(String[] args) {
        ConsoleRunnable runner = new ImportGeneSetHierarchy(args);
        runner.runInConsole();        
    }


    
}
