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
import java.sql.*;

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
	                + "(`NODE_NAME`, `PARENT_ID`) VALUES(?,?)", Statement.RETURN_GENERATED_KEYS);
	        
            // Fill in statement
            preparedStatement.setString(1, geneSetHierarchy.getNodeName());
            preparedStatement.setInt(2, geneSetHierarchy.getParentId());
            
            // Execute statement
            preparedStatement.executeUpdate();

            // Get the auto generated key, which is the Node ID:
            resultSet = preparedStatement.getGeneratedKeys();
            resultSet.next();
            geneSetHierarchy.setNodeId(resultSet.getInt(1));
            
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
	}


    /**
     * Retrieve gene set hierarchy object from geneset_hierarchy table in database to check if table if filled.
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
     * @throws DaoException 
     */
	public GeneSetHierarchy getGeneSetHierarchyFromNodeId(int nodeId) throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchy.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy WHERE NODE_ID = ?");
            preparedStatement.setInt(1, nodeId);

            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            // Extract geneSetHierarchy values
            resultSet.next();
            GeneSetHierarchy geneSetHierarchy = new GeneSetHierarchy();
            geneSetHierarchy.setNodeId(resultSet.getInt("NODE_ID"));
            geneSetHierarchy.setNodeName(resultSet.getString("NODE_NAME"));
            geneSetHierarchy.setParentId(resultSet.getInt("PARENT_ID"));
            
            return geneSetHierarchy;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
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
//        	preparedStatement = connection.prepareStatement("DELETE FROM geneset_hierarchy");
//        	preparedStatement.executeUpdate();
        	
        	String[] SQLs = {"DELETE FROM geneset_hierarchy", 
        			"ALTER TABLE geneset_hierarchy AUTO_INCREMENT = 1"};
            for (String sql : SQLs) {
            	preparedStatement = connection.prepareStatement(sql);
            	preparedStatement.executeUpdate();
            }
        }
        catch (SQLException e) {
            throw new DaoException(e);
        } 
        finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchy.class, connection, preparedStatement, resultSet);
        }
    }
    
}
