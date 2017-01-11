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

package org.mskcc.cbio.portal.dao;

import org.cbioportal.model.GeneSetInfo;
import org.cbioportal.model.GeneSet;
import org.mskcc.cbio.portal.model.CanonicalGene;
import org.mskcc.cbio.portal.scripts.ImportGeneSetData;
import org.mskcc.cbio.portal.util.ProgressMonitor;

import java.sql.*;
import java.util.*;

public class DaoGeneSetInfo {
	
	// Initialise DaoGeneSet instance
	private static DaoGeneSetInfo instance = new DaoGeneSetInfo();
	
	// Keep Constructor empty
	private DaoGeneSetInfo() {
	}
	
	// Access instance from outside the class
	public static DaoGeneSetInfo getInstance(){
		return instance;
	}
    
	/**
     * Set gene set version in geneset_info table in database.
     * @throws DaoException 
     */
    public void setGeneSetVersion(GeneSetInfo geneSetInfo) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("INSERT INTO geneset_info " 
	                + "(`GENESET_VERSION`) VALUES(?)");	        
            
            // Fill in statement
            preparedStatement.setString(1, geneSetInfo.getVersion());
            
            // Execute statement
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetInfo.class, connection, preparedStatement, resultSet);
        }
    }	
    	
	/**
     * Set gene set version in geneset_info table in database.
     * @throws DaoException 
     */
    public void updateGeneSetVersion(GeneSetInfo geneSetInfo) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("UPDATE geneset_info SET GENESET_VERSION=" + geneSetInfo.getVersion());
            
            // Execute statement
            preparedStatement.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetInfo.class, connection, preparedStatement, resultSet);
        }
    }	
    
	/**
     * Get gene set version from geneset_info table in database.
     * @throws DaoException 
     */
    public GeneSetInfo getGeneSetVersion() throws DaoException {
    	
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
        	connection = JdbcUtil.getDbConnection(DaoGeneSetInfo.class);
        	
	        // Prepare SQL statement
        	preparedStatement = connection.prepareStatement(
        			"SELECT * FROM geneset_info");
        	
            // Execute statement
        	resultSet = preparedStatement.executeQuery();
        	GeneSetInfo geneSetInfo = new GeneSetInfo();

            // Extract version from result
            if (resultSet.next()) {
                geneSetInfo.setVersion(resultSet.getString("GENESET_VERSION"));
            }    
        	return geneSetInfo;
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetInfo.class, connection, preparedStatement, resultSet);
        }
    }
}


