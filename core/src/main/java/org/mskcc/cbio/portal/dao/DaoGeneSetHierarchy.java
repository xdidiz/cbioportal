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

import org.cbioportal.model.GeneSetHierarchy;
import org.mskcc.cbio.portal.model.CanonicalGene;
import org.mskcc.cbio.portal.scripts.ImportGeneSetData;
import org.mskcc.cbio.portal.util.ProgressMonitor;

import java.sql.*;
import java.util.*;

public class DaoGeneSetHierarchy {
	
	// Initialise DaoGeneSetHierarchy instance
	private static DaoGeneSetHierarchy instance = new DaoGeneSetHierarchy();
	
	// Keep Constructor empty
	private DaoGeneSetHierarchy() {
	}
	
	// Access instance from outside the class
	public static DaoGeneSetHierarchy getInstance(){
		return instance;
	}
    
	/**
     * Add gene set hierarchy object to geneset_hierarchy table in database.
     * @throws DaoException 
     */
	public void addGeneSetHierarchy(GeneSetHierarchy geneSetHierarchy) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("INSERT INTO geneset_hierarchy " 
	                + "(`NODE_ID`, `NODE_NAME`, `PARENT_ID`) VALUES(?,?,?)");
	        
            // Fill in statement
            preparedStatement.setInt(1, geneSetHierarchy.getNodeId());
            preparedStatement.setString(2, geneSetHierarchy.getNodeName());
            preparedStatement.setInt(3, geneSetHierarchy.getParentId());
            
            // Execute statement
            preparedStatement.executeUpdate();
            
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
	}
	
	/**
     * Add gene set hierarchy object to geneset_hierarchy table in database.
     * @throws DaoException 
     */	
	public void addGeneSetHierarchyLeaf(int nodeId, int geneSetId) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("INSERT INTO geneset_hierarchy_leaf " 
	                + "(`NODE_ID`, `GENESET_ID`) VALUES(?,?)");
	        
            // Fill in statement
            preparedStatement.setInt(1, nodeId);
            preparedStatement.setInt(2, geneSetId);
            
            // Execute statement
            preparedStatement.executeUpdate();
            
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
	}



    /**
     * Retrieve gene set hierarchy object from geneset_hierarchy table in database.
     * @throws DaoException 
     */
	public boolean checkGeneSetHierarchy() throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy LIMIT 1");
            
            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            // return null if result set is empty
            if (!resultSet.next()){
            //ResultSet is empty
            	return true;
            }
            return false;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
	}
	
    /**
     * Retrieve gene set hierarchy objects from geneset_hierarchy table in database.
     */
	public List<GeneSetHierarchy> getGeneSetHierarchies() {
		return null;
	}

	
    /**
     * Retrieve gene set hierarchy leaf objects from geneset_hierarchy_leaf table in database.
     */
	public List<GeneSetHierarchy> getGeneSetHierarchieLeafs() {
		return null;
	}

	
    /**
     * Deletes all records from 'geneset_hierarchy_parent' table in database
     * @throws DaoException 
     */   
	public void deleteAllGeneSetHierarchyRecords() throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        try {
        	connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
        	preparedStatement = connection.prepareStatement("DELETE FROM geneset_hierarchy");
        	preparedStatement.executeUpdate();
        }
        catch (SQLException e) {
            throw new DaoException(e);
        } 
        finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
    }
    
}
