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
import org.cbioportal.model.GeneSetHierarchyLeaf;
import java.sql.*;

public class DaoGeneSetHierarchyLeaf {
	
	// Initialise DaoGeneSetHierarchy instance
	private static DaoGeneSetHierarchyLeaf instance = new DaoGeneSetHierarchyLeaf();
	
	// Keep Constructor empty
	private DaoGeneSetHierarchyLeaf() {
	}
	
	// Access instance from outside the class
	public static DaoGeneSetHierarchyLeaf getInstance(){
		return instance;
	}
    

	/**
     * Add gene set hierarchy object to geneset_hierarchy table in database.
     * @throws DaoException 
     */	
	public void addGeneSetHierarchyLeaf(GeneSetHierarchyLeaf geneSetHierarchyLeaf) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("INSERT INTO geneset_hierarchy_leaf " 
	                + "(`NODE_ID`, `GENESET_ID`) VALUES(?,?)");
	        
            // Fill in statement
            preparedStatement.setInt(1, geneSetHierarchyLeaf.getNodeId());
            preparedStatement.setInt(2, geneSetHierarchyLeaf.getGeneSetId());
            
            // Execute statement
            preparedStatement.executeUpdate();
            
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}

	
    /**
     * Retrieve gene set hierarchy leaf objects from geneset_hierarchy_leaf table in database.
     * @throws DaoException 
     */
	public GeneSetHierarchyLeaf getGeneSetHierarchyLeafsByNodeId(int nodeId) throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy_lef WHERE NODE_ID = ?");
            preparedStatement.setInt(1, nodeId);

            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            GeneSetHierarchyLeaf geneSetHierarchyLeaf = new GeneSetHierarchyLeaf();
            geneSetHierarchyLeaf.setNodeId(resultSet.getInt("NODE_ID"));
            geneSetHierarchyLeaf.setGeneSetId(resultSet.getInt("GENESET_ID"));
            
            return geneSetHierarchyLeaf;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}
	
	public GeneSetHierarchyLeaf getGeneSetHierarchyLeafsByGeneSetId(int geneSetId) throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy_leaf WHERE GENESET_ID = ?");
            preparedStatement.setInt(1, geneSetId);

            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            GeneSetHierarchyLeaf geneSetHierarchyLeaf = new GeneSetHierarchyLeaf();
            resultSet.next();
            geneSetHierarchyLeaf.setNodeId(resultSet.getInt("NODE_ID"));
            geneSetHierarchyLeaf.setGeneSetId(resultSet.getInt("GENESET_ID"));
            
            return geneSetHierarchyLeaf;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}

	
    /**
     * Deletes all records from 'geneset_hierarchy_parent' table in database
     * @throws DaoException 
     */   
	public void deleteAllGeneSetHierarchyLeafRecords() throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        try {
        	connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
//        	preparedStatement = connection.prepareStatement("DELETE FROM geneset_hierarchy");
//        	preparedStatement.executeUpdate();
        	
        	String[] SQLs = {"DELETE FROM geneset_hierarchy", 
        			"ALTER TABLE geneset_hierarchy_leaf AUTO_INCREMENT = 1"};
            for (String sql : SQLs) {
            	preparedStatement = connection.prepareStatement(sql);
            	preparedStatement.executeUpdate();
            }
        }
        catch (SQLException e) {
            throw new DaoException(e);
        } 
        finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
    }
    
}
