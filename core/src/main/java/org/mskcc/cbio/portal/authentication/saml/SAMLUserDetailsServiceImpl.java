/*
 * Copyright (c) 2016 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
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

package org.mskcc.cbio.portal.authentication.saml;

import org.mskcc.cbio.portal.model.User;
import org.mskcc.cbio.portal.model.UserAuthorities;
import org.mskcc.cbio.portal.dao.PortalUserDAO;
import org.opensaml.saml2.core.Attribute;

import org.mskcc.cbio.portal.authentication.PortalUserDetails;
import org.mskcc.cbio.portal.util.GlobalProperties;

import org.springframework.security.saml.*;
import org.springframework.security.saml.userdetails.*;

import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;

import org.apache.commons.logging.*;

import java.util.*;

/**
 * Custom UserDetailsService which parses SAML messages and checks authorization of
 * user against cbioportal's `authorities` configuration. Authentication is done by the SAML IDP.
 *
 * @author Pieter Lukasse
 */
public class SAMLUserDetailsServiceImpl implements SAMLUserDetailsService
{
    private static final Log log = LogFactory.getLog(SAMLUserDetailsServiceImpl.class);
    private static final Collection<String> defaultAuthorities = initializeDefaultAuthorities();
    
    /**
     * Initializes default (public) authorities that each authenticated user gets.
     * 
     * @return if always_show_study_group is configured in portal.properties, if returns the list with the 
     * corresponding authority code string, which is an item like e.g. "cbioportal:PUBLIC". Returns empty 
     * list otherwise. 
     */
    private static final Collection<String> initializeDefaultAuthorities()
    {
        String appName = GlobalProperties.getAppName();
        Collection<String> toReturn = new ArrayList<String>();
        //Add the public study group, if configured in portal.properties:
        if (GlobalProperties.getAlwaysShowStudyGroup() != null) {
        	toReturn.add(appName + ":" + GlobalProperties.getAlwaysShowStudyGroup()); 
        }
        return toReturn;
    }

    private final PortalUserDAO portalUserDAO;

    /**
     * Constructor.
     *
     * Takes a ref to PortalUserDAO used to check authorization of registered
     * users in the database.
     *
     * @param portalUserDAO PortalUserDAO
     */
    public SAMLUserDetailsServiceImpl(PortalUserDAO portalUserDAO) {
        this.portalUserDAO = portalUserDAO;
    }
          

    /**
     * Implementation of {@code SAMLUserDetailsService}. Parses user details from given 
     * SAML credential object.
     */
    @Override
    public Object loadUserBySAML(SAMLCredential credential)
    {
		PortalUserDetails toReturn = null;

		String userId = null;
		String name = null;
		// get userid and name: iterate over attributes searching for "mail" and "displayName":
        for (Attribute cAttribute : credential.getAttributes()) {
        	log.debug("loadUserBySAML(), parsing attribute - " + cAttribute.toString());
        	log.debug("loadUserBySAML(), parsing attribute - " + cAttribute.getName());
        	log.debug("loadUserBySAML(), parsing attribute - " + credential.getAttributeAsString(cAttribute.getName()));
        	if (userId == null && cAttribute.getName().equals("mail"))
        	{
        		userId = credential.getAttributeAsString(cAttribute.getName());
        	}
        	else if (name == null && cAttribute.getName().equals("displayName"))
        	{
        		name = credential.getAttributeAsString(cAttribute.getName());
        	}
        }

		// check if this user exists in our backend db
		try {
            log.debug("loadUserDetails(), IDP successfully authenticated user, userid: " + userId);
            log.debug("loadUserDetails(), now attempting to fetch portal user authorities for userid: " + userId);
            
            User user = portalUserDAO.getPortalUser(userId);
            if (user != null) {
            	if (user.isEnabled()) {
                    log.debug("loadUserDetails(), user is enabled; attempting to fetch portal user authorities, userid: " + userId);

                    UserAuthorities authorities = portalUserDAO.getPortalUserAuthorities(userId);
	                if (authorities != null) {
	                    List<GrantedAuthority> grantedAuthorities =
	                        AuthorityUtils.createAuthorityList(authorities.getAuthorities().toArray(new String[authorities.getAuthorities().size()]));
	                    //ensure that granted authorities contains default items:
                        grantedAuthorities.addAll(getDefaultGrantedAuthorities(userId));
	                    toReturn = new PortalUserDetails(userId, grantedAuthorities);
	                    toReturn.setEmail(userId);
	                    toReturn.setName(userId);
	                } else {
	                    log.debug("loadUserDetails(), user authorities is null, userid: " + userId + ". Granting it default access (to PUBLIC studies)");
	                	toReturn = new PortalUserDetails(userId, getDefaultGrantedAuthorities(userId));
	                    toReturn.setEmail(userId);
	                    toReturn.setName(userId);
	                }
	                //in any case, default authorities should also be coupled to dao user:
	                portalUserDAO.addPortalUserAuthorities(new UserAuthorities(userId, defaultAuthorities));
            	} else {
            		//user has been actively disabled:
            		throw new UsernameNotFoundException("Error:  User account is disabled");
            	}
            } else {
            	//if user is not in DB but is successfully authenticated, just give him the default access
            	//to PUBLIC studies:
                log.debug("loadUserDetails(), user and user authorities is null, userid: " + userId + ". Granting it default access (to PUBLIC studies)");
            	toReturn = new PortalUserDetails(userId, getDefaultGrantedAuthorities(userId));
                portalUserDAO.addPortalUser(new User(userId, name, true));
                portalUserDAO.addPortalUserAuthorities(new UserAuthorities(userId, defaultAuthorities));
            }
    		return toReturn;
		}
		catch (Exception e) {
			log.error(e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error during authentication parsing: " + e.getMessage());
		}

    }

    /**
     * Returns the defaultAuthorities in List<GrantedAuthority> format.
     * 
     * @param userId
     * @return
     */
    private List<GrantedAuthority> getDefaultGrantedAuthorities(final String userId)
    {
        Collection<String> defAuthorities = new ArrayList<String>(defaultAuthorities);
        UserAuthorities authorities = new UserAuthorities(userId, defAuthorities);
        return AuthorityUtils.createAuthorityList(authorities.getAuthorities().toArray(new String[authorities.getAuthorities().size()]));

    }
}

