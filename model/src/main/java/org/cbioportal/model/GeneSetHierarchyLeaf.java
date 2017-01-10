package org.cbioportal.model;

import java.io.Serializable;

public class GeneSetHierarchyLeaf implements Serializable {

	private int nodeId;
	private int geneSetId;

	public void setNodeId(int nodeId) {
		this.nodeId = nodeId;
	}
	
	public int getNodeId() {
		return nodeId;
	}

	public void setGeneSetId(int geneSetId) {
		this.geneSetId = geneSetId;
	}
	public int getGeneSetId() {
		return geneSetId;
	}
}


