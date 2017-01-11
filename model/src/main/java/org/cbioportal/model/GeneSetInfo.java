package org.cbioportal.model;

import java.io.Serializable;

public class GeneSetInfo implements Serializable {
	private String version;
	
    public String getVersion() {
        return version;
    }
    
    public void setVersion(String version) {
        this.version = version;
    }

}